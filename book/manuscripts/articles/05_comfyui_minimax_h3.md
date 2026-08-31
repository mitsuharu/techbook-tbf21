---
class: content
title: Windows + Radeon GPU 環境で Claude Code と ComfyUI + MiniMax H3 を利用して動画を生成する
author: 江本光晴
profile: |
  モバイルアプリ開発者。自作 PC とローカル LLM の検証を趣味にしています。
---

<div class="doc-header">
  <div class="doc-title">Windows + Radeon GPU 環境で Claude Code と ComfyUI + MiniMax H3 を利用して動画を生成する</div>
</div>

# Windows + Radeon GPU 環境で Claude Code と ComfyUI + MiniMax H3 を利用して動画を生成する

<aside class="publication-note">
  <div class="publication-note-label">Information</div>
  <div class="publication-note-text">これは 2026 年 8 月 26 日にブログで掲載しました。適宜、加筆修正しています。</div>
  <div class="publication-note-url">掲載元：https://mthr.hatenablog.com/entry/2026/08/26/122829</div>
</aside>

<!-- textlint-disable -->

先日、動画生成できるオープンウェイトモデル MiniMax H3 が公開されました。一般的な家庭向けのスペックでも動くと SNS でもバスったので、知ってる方も多いはず。

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/huggingface.co.png" alt="huggingface.co のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">MiniMaxAI/MiniMax-H3 · Hugging Face</div>
    <div class="link-card-url">https://huggingface.co/MiniMaxAI/MiniMax-H3</div>
  </div>
</div>

ローカルで動画を作るには、ComfyUI と組み合わせればいいらしいということで、私も話題に乗って試しました。

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/comfy.org.png" alt="comfy.org のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">Comfy - Professional Control of Visual AI</div>
    <div class="link-card-url">https://comfy.org/</div>
  </div>
</div>

結論から言うと、GeForce GPU ではあっさり動いたが、Radeon GPU ではComfyUIの起動からしてつまずいた。その試行錯誤をまとめました。まあ、主に施行してくれたのは、Claude Code なんですが。

## GeForce 環境では簡単に動画生成

まず GeForce を積んだ検証機で試しました。ComfyUIの公式サイトからデスクトップ版をダウンロードして、インストーラーを進める。数分後には ComfyUI の環境が完成しました。

すでに MiniMax H3 に対応したテンプレートがあり、そのワークフローを選択します。そして、モデルをダウンロードして、Run ボタンを押したら動画が生成されました。簡単でした。

<div class="link-card x-post-card">
  <div class="link-card-body">
    <div class="link-card-title">Mitsuharu Emoto（@mitsuharu_e）の投稿 / X</div>
    <div class="link-card-text">ComfyUI + MiniMax H3のデフォルトのワークフローでプロンプトだけ変更した。RAM 32 GB / RTX 4070 Ti 12 GB で864x480の8秒で約7分で生成できた</div>
    <img class="link-card-media" src="./05_comfyui_minimax_h3/x-post-2086787701039305127.jpg" alt="ComfyUIとMiniMax H3で生成した動画のサムネイル">
    <div class="link-card-url">https://x.com/mitsuharu_e/status/2086787701039305127</div>
  </div>
</div>

## Radeon だと ComfyUI をインストールに手こずる

同じ手順を Radeon GPU の検証機でも試しました。しかし、ComfyUI がうまく起動しない。なんで GeForce だと動いて、Radeon だとコケるのか。Claude に聞いてみると、次が理由らしい。

**GeForce の場合**

1. 公式インストーラーを実行する
2. 同梱の PyTorch が最初から CUDA 向けにビルドされている
3. `torch.cuda.is_available()` が素で `True` になる
4. → そのまま動画生成できる

**Radeon の場合**

1. 同じ公式インストーラーを実行する
2. 同梱の PyTorch は CUDA 向けで、AMD の GPU はサポートしていない
3. 終了

ComfyUI 自体が AMD 非対応というわけではなく、公式インストーラーがサポートしてるのは CUDA (NVIDIA) 向けのようです。AMD で動かすには ROCm 対応の PyTorch を自分で入れる必要があるようです。

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">GitHub - Comfy-Org/ComfyUI: The most powerful and modular diffusion model GUI, api and backend with a graph/nodes interface.</div>
    <div class="link-card-url">https://github.com/comfy-org/comfyui</div>
  </div>
</div>

そこで、AI が教えてくれた ROCm と相性がいいという Python 3.12 をインストールする。そして、インストーラーではなく、GitHub Releases で公開されているアセットをダウンロードして、環境を構築していきました。なんとか起動まではこぎ着けましたが、Geforce で見た画面と若干異なっており何をすればいんだと、その日は諦めました。

## というわけで Claude Code に丸投げした

Claude Code に「このパソコンはRadeon gpuです。このパソコンでcomfyui + minimax h3で動画生成できるようにできる？」って伝えて、あとは調査からインストール、実際に動画が生成できるかの確認まで一通りやってもらうことにしました。

### ROCm 版 PyTorch を GPU の型番に合わせて選ぶ

検証機の GPU は AMD Radeon AI PRO R9700 (32GB) を２つ搭載しています。まずこの型番のアーキテクチャコード gfx1201 を特定してもらって、AMD の配布サーバーから対応する ROCm SDK と PyTorch のビルドをインストールしました。

```powershell
# venv作成 → ROCm SDK → ComfyUI本体 → 依存関係、のあとに
# ROCm版PyTorchを最後に入れ直す(この順番が重要)
python -m pip install --no-cache-dir `
    https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/torch-2.9.1%2Brocm7.2.1-cp312-cp312-win_amd64.whl `
    https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/torchaudio-2.9.1%2Brocm7.2.1-cp312-cp312-win_amd64.whl `
    https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/torchvision-0.24.1%2Brocm7.2.1-cp312-cp312-win_amd64.whl
```

この順番は、ComfyUI 本体の依存関係インストールの途中で、汎用版 ( CUDA/CPU 向け) の PyTorch が一緒に入ってきてしまうので、ROCm版を最後に上書きするようにしています。起動ログに GPU が表示されたので、成功です。

```
AMD arch: gfx1201
Device: cuda:0 AMD Radeon AI PRO R9700 : native
Device: cuda:1 AMD Radeon AI PRO R9700 : native
```

### モデルの量子化形式選びにハマる

Radeon GPU が認識されても、モデルが読み込めないとダメです。ここで見事に二回ハマった。

**その1：コミュニティ製のGGUF**

有志が変換してくれた GGUF 量子化版を使おうとしたら、読み込み時に次のようなエラーが起こりました。

```text
ValueError: This gguf file is incompatible with llama.cpp!
Consider using safetensors or a compatible gguf file
```

MiniMax H3のモデル構造が新しすぎて、GGUF を読み込む側 (ComfyUI-GGUF 拡張) がまだこのアーキテクチャを認識できてなかった。というわけで、GGUF 版はあきらめました。

**その2：公式デフォルトのテキストエンコーダー**

公式ワークフローが標準で指定してるテキストエンコーダーは `NVFP4` っていう量子化形式です。これは NVIDIA の Tensor Core 専用フォーマットで、Radeon の ROCm 側に対応していませんでした。

最終的に落ち着いたのは、公式が配布してるもう一つの量子化版 `int8_convrot` です。UNet もテキストエンコーダーもこの形式に揃えたら、あっさり動きました。GeForce なら何も考えずに済む組み合わせを、Radeon では自分で選び直す必要がありました。

### 動画生成

MiniMax H3 は公式スキルを公開しているので、このスキルの存在を Claude Code に伝えました。これにより、Claude に「xxxの動画を作って」と雑に指示しても、内部で MiniMax 向けの良い感じのプロンプトを生成してくれるようになりました。

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">MiniMax-H3/skills at main · MiniMax-AI/MiniMax-H3</div>
    <div class="link-card-url">https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills</div>
  </div>
</div>

動画作成の指示を与えると、バックエンドで ComfyUI が立ち上がり、面倒な処理は不要で動画が作成されます。ComfyUI のワークフローを直接触ったほうが、より精度や表現力が高い動画は作れるかもしれませんが、私のようなライトユーザーには十分です。

### 動くには動いたけど、たまにサーバーが落ちる

解像度を上げて長めの生成を試してるうちに、ComfyUI のサーバーが生成の途中で落ちることが何回かありました。RAM や VRAM 不足なのか、原因はまだ特定できてないです。Windows の ROCm がまだ発展途上なので、何かあるかも。

対策として、サーバーの生死を監視して、落ちてたら自動で再起動して同じジョブを再投入する小さい Python スクリプトを書いて、Claude Codeのスキルとして組み込みました。これのおかげで、以降は「動画作って」と頼むだけで、この問題を意識しなくなりました。

## 作業ディレクトリを GitHub に公開した

ここまでの試行錯誤や作業ディレクトリをそのままリポジトリとして GitHub で公開しました。なお、ComfyUI 本体やモデルの重みファイルは合わせて 100GB 近くになるのと、公式配布から再取得できるので、`.gitignore` で除いています。それらの取得や初期設定などのスクリプトを用意しました。

| ファイル/ディレクトリ | 役割 |
| :-- | :-- |
| `README.md` / `SETUP.md` | 環境の要件・つまずきポイント・再現手順 |
| `scripts/setup.ps1` | venv〜ROCm〜ComfyUI〜モデルまで一括構築 |
| `scripts/download_models.ps1` | モデルだけ再ダウンロード(中断からの再開対応) |
| `.claude/skills/minimax-h3-video` | Claude Codeで動画生成を自動化するスキル |

別の Radeon (RX 9060 XT 16GB) でも同じ手順を試したら、問題なく動きました。なお、同じプロンプトや条件 (1344×768・約5秒・20ステップ) でも、生成にかかる時間は、R9700 が約5分なのに対して、RX 9060 XT は約15分と、3倍ぐらいの違いがありました。VRAM が少ない分、ComfyUI がモデルの一部をシステム RAM との間でオフロードしながら動いてるからだと推測します。ともあれ、Radeon 環境でも簡単に動画生成することができました。

## まとめ

GeForceなら意識する必要すらなかった手順が、Radeon では１つずつ調べて選び直す作業になりました。しかし、面倒なことは Claude に任せたら、無事に動画生成ができるようになりました。ちょっと遊んでますが、簡単に動画が作成できるので、いいですね。本格的に作品となるような動画生成をしくなったら、Claude Code ではなく無検閲なエージェントに頼むのも手かもしれませんね。

今回の作業は GitHub にて公開しています。同じ Windows + Radeon 環境で動画生成に興味ある方がいれば、ご参照してください。

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">GitHub - mitsuharu/ComfyUI-ROCm: Windows11 + Radeon 環境で Claude Code を利用して ComfyUI + MiniMax H3 を動かす</div>
    <div class="link-card-url">https://github.com/mitsuharu/ComfyUI-ROCm</div>
  </div>
</div>

<!-- textlint-enable -->
