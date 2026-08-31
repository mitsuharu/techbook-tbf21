---
class: content
title: Windows + Radeon GPU 環境で Claude Code と ComfyUI + MiniMax H3 を利用して動画を生成する
author: 江本光晴
profile: |
  モバイルアプリ開発者。自作 PC とローカル LLM の検証を趣味にしています。
---

# Windows + Radeon GPU 環境で Claude Code と ComfyUI + MiniMax H3 を利用して動画を生成する

<aside class="publication-note">
  <div class="publication-note-label">転載記事</div>
  <p>これは 2026 年 8 月 26 日に mthr blog で掲載しました。本文を、表記を変えずに転載しています。埋め込み URL は印刷できるリンクカードに置き換えました。</p>
  <p class="publication-note-url">掲載元：https://mthr.hatenablog.com/entry/2026/08/26/122829</p>
</aside>

<!-- textlint-disable -->

<p>先日、動画生成できるオープンウェイトモデル MiniMax H3 が公開されました。一般的な家庭向けのスペックでも動くと SNS でもバスったので、知ってる方も多いはず。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/huggingface.co.png" alt="huggingface.co のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">MiniMaxAI/MiniMax-H3 · Hugging Face</div>
    <div class="link-card-domain">huggingface.co</div>
    <div class="link-card-url">https://huggingface.co/MiniMaxAI/MiniMax-H3</div>
  </div>
</div>

<p>ローカルで動画を作るには、ComfyUI と組み合わせればいいらしいということで、私も話題に乗って試しました。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/comfy.org.png" alt="comfy.org のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">Comfy - Professional Control of Visual AI</div>
    <div class="link-card-domain">comfy.org</div>
    <div class="link-card-url">https://comfy.org/</div>
  </div>
</div>

<p>結論から言うと、GeForce GPU ではあっさり動いたが、Radeon GPU ではComfyUIの起動からしてつまずいた。その試行錯誤をまとめました。まあ、主に施行してくれたのは、Claude Code なんですが。</p>

<h2 id="GeForce-環境では簡単に動画生成">GeForce 環境では簡単に動画生成</h2>

<p>まず GeForce を積んだ検証機で試しました。ComfyUIの公式サイトからデスクトップ版をダウンロードして、インストーラーを進める。数分後には ComfyUI の環境が完成しました。</p>

<p>すでに MiniMax H3 に対応したテンプレートがあり、そのワークフローを選択します。そして、モデルをダウンロードして、Run ボタンを押したら動画が生成されました。簡単でした。</p>

<p><blockquote data-conversation="none" class="twitter-tweet" data-lang="ja"><p lang="ja" dir="ltr">ComfyUI + MiniMax H3のデフォルトのワークフローでプロンプトだけ変更した。RAM 32 GB / RTX 4070 Ti 12 GB で864x480の8秒で約7分で生成できた <a href="https://t.co/2STt6sofHK">pic.twitter.com/2STt6sofHK</a></p>&mdash; Mitsuharu Emoto (@mitsuharu_e) <a href="https://x.com/mitsuharu_e/status/2086787701039305127?ref_src=twsrc%5Etfw">2026年8月10日</a></blockquote>  </p>

<h2 id="Radeon-だと-ComfyUI-をインストールに手こずる">Radeon だと ComfyUI をインストールに手こずる</h2>

<p>同じ手順を Radeon GPU の検証機でも試しました。しかし、ComfyUI がうまく起動しない。なんで GeForce だと動いて、Radeon だとコケるのか。Claude に聞いてみると、次が理由らしい。</p>

<p><strong>GeForce の場合</strong></p>

<ol>
<li>公式インストーラーを実行する</li>
<li>同梱の PyTorch が最初から CUDA 向けにビルドされている</li>
<li><code>torch.cuda.is_available()</code> が素で <code>True</code> になる</li>
<li>→ そのまま動画生成できる</li>
</ol>


<p><strong>Radeon の場合</strong></p>

<ol>
<li>同じ公式インストーラーを実行する</li>
<li>同梱の PyTorch は CUDA 向けで、AMD の GPU はサポートしていない</li>
<li>終了</li>
</ol>


<p>ComfyUI 自体が AMD 非対応というわけではなく、公式インストーラーがサポートしてるのは CUDA (NVIDIA) 向けのようです。AMD で動かすには ROCm 対応の PyTorch を自分で入れる必要があるようです。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">GitHub - Comfy-Org/ComfyUI: The most powerful and modular diffusion model GUI, api and backend with a graph/nodes interface.</div>
    <div class="link-card-domain">github.com</div>
    <div class="link-card-url">https://github.com/comfy-org/comfyui</div>
  </div>
</div>

<p>そこで、AI が教えてくれた ROCm と相性がいいという Python 3.12 をインストールする。そして、インストーラーではなく、GitHub Releases で公開されているアセットをダウンロードして、環境を構築していきました。なんとか起動まではこぎ着けましたが、Geforce で見た画面と若干異なっており何をすればいんだと、その日は諦めました。</p>

<h2 id="というわけで-Claude-Code-に丸投げした">というわけで Claude Code に丸投げした</h2>

<p>Claude Code に「このパソコンはRadeon gpuです。このパソコンでcomfyui + minimax h3で動画生成できるようにできる？」って伝えて、あとは調査からインストール、実際に動画が生成できるかの確認まで一通りやってもらうことにしました。</p>

<h3 id="ROCm-版-PyTorch-を-GPU-の型番に合わせて選ぶ">ROCm 版 PyTorch を GPU の型番に合わせて選ぶ</h3>

<p>検証機の GPU は AMD Radeon AI PRO R9700 (32GB) を２つ搭載しています。まずこの型番のアーキテクチャコード gfx1201 を特定してもらって、AMD の配布サーバーから対応する ROCm SDK と PyTorch のビルドをインストールしました。</p>

<pre class="code powershell" data-lang="powershell" data-unlink># venv作成 → ROCm SDK → ComfyUI本体 → 依存関係、のあとに
# ROCm版PyTorchを最後に入れ直す(この順番が重要)
python -m pip install --no-cache-dir `
    https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/torch-2.9.1%2Brocm7.2.1-cp312-cp312-win_amd64.whl `
    https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/torchaudio-2.9.1%2Brocm7.2.1-cp312-cp312-win_amd64.whl `
    https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/torchvision-0.24.1%2Brocm7.2.1-cp312-cp312-win_amd64.whl</pre>


<p>この順番は、ComfyUI 本体の依存関係インストールの途中で、汎用版 ( CUDA/CPU 向け) の PyTorch が一緒に入ってきてしまうので、ROCm版を最後に上書きするようにしています。起動ログに GPU が表示されたので、成功です。</p>

<pre class="code" data-lang="" data-unlink>AMD arch: gfx1201
Device: cuda:0 AMD Radeon AI PRO R9700 : native
Device: cuda:1 AMD Radeon AI PRO R9700 : native</pre>


<h3 id="モデルの量子化形式選びにハマる">モデルの量子化形式選びにハマる</h3>

<p>Radeon GPU が認識されても、モデルが読み込めないとダメです。ここで見事に二回ハマった。</p>

<p><strong>その1：コミュニティ製のGGUF</strong></p>

<p>有志が変換してくれた GGUF 量子化版を使おうとしたら、読み込み時に次のようなエラーが起こりました。</p>

<pre class="code text" data-lang="text" data-unlink>ValueError: This gguf file is incompatible with llama.cpp!
Consider using safetensors or a compatible gguf file</pre>


<p>MiniMax H3のモデル構造が新しすぎて、GGUF を読み込む側 (ComfyUI-GGUF 拡張) がまだこのアーキテクチャを認識できてなかった。というわけで、GGUF 版はあきらめました。</p>

<p><strong>その2：公式デフォルトのテキストエンコーダー</strong></p>

<p>公式ワークフローが標準で指定してるテキストエンコーダーは <code>NVFP4</code> っていう量子化形式です。これは NVIDIA の Tensor Core 専用フォーマットで、Radeon の ROCm 側に対応していませんでした。</p>

<p>最終的に落ち着いたのは、公式が配布してるもう一つの量子化版 <code>int8_convrot</code> です。UNet もテキストエンコーダーもこの形式に揃えたら、あっさり動きました。GeForce なら何も考えずに済む組み合わせを、Radeon　では自分で選び直す必要がありました。</p>

<h3 id="動画生成">動画生成</h3>

<p>MiniMax H3 は公式スキルを公開しているので、このスキルの存在を Claude Code に伝えました。これにより、Claude に「xxxの動画を作って」と雑に指示しても、内部で MiniMax  向けの良い感じのプロンプトを生成してくれるようになりました。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">MiniMax-H3/skills at main · MiniMax-AI/MiniMax-H3</div>
    <div class="link-card-domain">github.com</div>
    <div class="link-card-url">https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills</div>
  </div>
</div>

<p>動画作成の指示を与えると、バックエンドで ComfyUI が立ち上がり、面倒な処理は不要で動画が作成されます。ComfyUI のワークフローを直接触ったほうが、より精度や表現力が高い動画は作れるかもしれませんが、私のようなライトユーザーには十分です。</p>

<h3 id="動くには動いたけどたまにサーバーが落ちる">動くには動いたけど、たまにサーバーが落ちる</h3>

<p>解像度を上げて長めの生成を試してるうちに、ComfyUI のサーバーが生成の途中で落ちることが何回かありました。RAM や VRAM 不足なのか、原因はまだ特定できてないです。Windows の ROCm がまだ発展途上なので、何かあるかも。</p>

<p>対策として、サーバーの生死を監視して、落ちてたら自動で再起動して同じジョブを再投入する小さい Python スクリプトを書いて、Claude Codeのスキルとして組み込みました。これのおかげで、以降は「動画作って」と頼むだけで、この問題を意識しなくなりました。</p>

<h2 id="作業ディレクトリを-GitHub-に公開した">作業ディレクトリを GitHub に公開した</h2>

<p>ここまでの試行錯誤や作業ディレクトリをそのままリポジトリとして GitHub で公開しました。なお、ComfyUI 本体やモデルの重みファイルは合わせて 100GB 近くになるのと、公式配布から再取得できるので、<code>.gitignore</code> で除いています。それらの取得や初期設定などのスクリプトを用意しました。</p>

<table>
<thead>
<tr>
<th style="text-align:left;"> ファイル/ディレクトリ </th>
<th style="text-align:left;"> 役割 </th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left;"> <code>README.md</code> / <code>SETUP.md</code> </td>
<td style="text-align:left;"> 環境の要件・つまずきポイント・再現手順 </td>
</tr>
<tr>
<td style="text-align:left;"> <code>scripts/setup.ps1</code> </td>
<td style="text-align:left;"> venv〜ROCm〜ComfyUI〜モデルまで一括構築 </td>
</tr>
<tr>
<td style="text-align:left;"> <code>scripts/download_models.ps1</code> </td>
<td style="text-align:left;"> モデルだけ再ダウンロード(中断からの再開対応) </td>
</tr>
<tr>
<td style="text-align:left;"> <code>.claude/skills/minimax-h3-video</code> </td>
<td style="text-align:left;"> Claude Codeで動画生成を自動化するスキル </td>
</tr>
</tbody>
</table>


<p>別の Radeon (RX 9060 XT 16GB) でも同じ手順を試したら、問題なく動きました。なお、同じプロンプトや条件 (1344×768・約5秒・20ステップ) でも、生成にかかる時間は、R9700 が約5分なのに対して、RX 9060 XT は約15分と、3倍ぐらいの違いがありました。VRAM が少ない分、ComfyUI がモデルの一部をシステム RAM との間でオフロードしながら動いてるからだと推測します。ともあれ、Radeon 環境でも簡単に動画生成することができました。</p>

<h2 id="まとめ">まとめ</h2>

<p>GeForceなら意識する必要すらなかった手順が、Radeon では１つずつ調べて選び直す作業になりました。しかし、面倒なことは Claude に任せたら、無事に動画生成ができるようになりました。ちょっと遊んでますが、簡単に動画が作成できるので、いいですね。本格的に作品となるような動画生成をしくなったら、Claude Code ではなく無検閲なエージェントに頼むのも手かもしれませんね。</p>

<p>今回の作業は GitHub にて公開しています。同じ Windows + Radeon 環境で動画生成に興味ある方がいれば、ご参照してください。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./05_comfyui_minimax_h3/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">GitHub - mitsuharu/ComfyUI-ROCm: Windows11 + Radeon 環境で Claude Code を利用して ComfyUI + MiniMax H3 を動かす</div>
    <div class="link-card-domain">github.com</div>
    <div class="link-card-url">https://github.com/mitsuharu/ComfyUI-ROCm</div>
  </div>
</div>

<!-- textlint-enable -->
