---
class: content
title: Radeon で ComfyUI と MiniMax H3 を動かす
author: 江本光晴
profile: |
  モバイルアプリ開発者。自作 PC とローカル LLM の検証を趣味にしています。
---

<div class="doc-header">
  <div class="doc-title">Radeon で ComfyUI と MiniMax H3 を動かす</div>
  <div class="doc-author">江本光晴</div>
</div>

# Radeon で ComfyUI と MiniMax H3 を動かす

ローカル LLM 用に構築した PC は、大容量 VRAM を持っています。この計算資源を推論だけでなく、画像や動画の生成にも使いたくなりました。そこで、ノードを組み合わせて生成処理を構築できる ComfyUI と、動画・音声生成モデル MiniMax H3 を Windows 11 の Radeon GPU で動かします。

GeForce では、ComfyUI の公式デスクトップ版を導入し、用意されたワークフローを選ぶだけで生成できました。同じ手順を Radeon で試すと、起動段階から失敗しました。本章では、CUDA 前提の配布物を避け、ROCm 版 PyTorch、対応する量子化形式、復旧処理を組み合わせた過程を説明します。作業記録と再現用スクリプトは公開しています。[^comfy-repository] [^comfy-blog]

[^comfy-repository]: [ComfyUI + ROCm + MiniMax H3](https://github.com/mitsuharu/ComfyUI-ROCm)
[^comfy-blog]: [Windows + Radeon GPU 環境で Claude Code と ComfyUI + MiniMax H3 を利用して動画を生成する](https://mthr.hatenablog.com/entry/2026/08/26/122829)

## 検証環境

最初の構築は、ROCm 7.2.1 を利用しました。次章で ROCm 10.0.0 へ更新します。

| 項目 | 主検証機 | 追加検証機 |
| :-- | :-- | :-- |
| OS | <span class="nowrap">Windows 11</span> | <span class="nowrap">Windows 11</span> |
| Python | 3.12 | 3.12 |
| GPU | <span class="nowrap">Radeon AI PRO R9700</span> 32 GB × 2 | <span class="nowrap">Radeon RX 9060 XT</span> 16 GB |
| GPU ターゲット | `gfx1201` | `gfx1200` |
| <span class="nowrap">ROCm</span> | 7.2.1 | 7.2.1 |
| 用途 | 主な構築と生成 | 16 GB VRAM での再現確認 |

MiniMax H3 の処理では、R9700 を 2 枚搭載していても、検証したワークフローは実質的に 1 枚分の VRAM を使いました。LLM 推論でモデルを 2 枚へ分割できたことと、同じようには考えられません。

## 公式デスクトップ版が動かなかった理由

ComfyUI 自体が Radeon に対応していないわけではありません。問題は、簡単に導入できる配布物が CUDA と NVIDIA GPU を主な対象にしていたことです。

GeForce の場合は、同梱された PyTorch が CUDA を利用し、`torch.cuda.is_available()`が`True`になります。Radeon では、CUDA 向け PyTorch が AMD GPU を利用できません。ComfyUI の画面へ到達できても、CPU 実行になるか、GPU 初期化で失敗します。

Radeon では、次の組み合わせを明示的にそろえます。

- Windows 版 ROCm が対応する GPU とドライバー
- ROCm に対応する Python と PyTorch
- GitHub から取得した ComfyUI 本体
- Radeon で利用できる MiniMax H3 の量子化形式
- モデルを正しいディレクトリへ置くセットアップ処理

## Python 環境を分離する

既存の Ollama、llama.cpp、他の Python アプリへ影響させないため、リポジトリ直下に仮想環境を作ります。ROCm 7.2.1 の初期構築では、依存関係を入れる順序が重要でした。

1. Python 3.12 で`.venv`を作る
2. ROCm SDK と ComfyUI 本体を準備する
3. ComfyUI の`requirements.txt`を導入する
4. ROCm 版 PyTorch を最後に入れ直す

ComfyUI の依存関係を導入する途中で、汎用版の PyTorch へ置き換わることがありました。先に導入した ROCm 版は上書きされます。そのため、最後に ROCm 版を指定します。

当時の例は次のとおりです。これは ROCm 7.2.1 用です。最新版の組み合わせは AMD の公式情報を確認してください。

```powershell
python -m pip install --no-cache-dir `
  https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/torch-2.9.1%2Brocm7.2.1-cp312-cp312-win_amd64.whl `
  https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/torchaudio-2.9.1%2Brocm7.2.1-cp312-cp312-win_amd64.whl `
  https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/torchvision-0.24.1%2Brocm7.2.1-cp312-cp312-win_amd64.whl
```

導入後は、パッケージ一覧だけでなく、Python から GPU を確認します。

```powershell
.\.venv\Scripts\python.exe -c `
  "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.device_count())"
```

ROCm でも PyTorch の互換 API は`torch.cuda`という名前を使います。ログに`cuda:0 AMD Radeon ...`と出ても、NVIDIA CUDA を使っているという意味ではありません。バックエンドとデバイス名を合わせて確認します。

## GPU ターゲットを特定する

Radeon AI PRO R9700 の GPU ターゲットは`gfx1201`です。RX 9060 XT は`gfx1200`です。PyTorch と ROCm がそのターゲットを含まなければ、GPU 名が見えても必要なカーネルを実行できない場合があります。

起動ログでは、次の項目を確認します。

```text
AMD arch: gfx1201
Device: cuda:0 AMD Radeon AI PRO R9700 : native
Device: cuda:1 AMD Radeon AI PRO R9700 : native
```

製品名だけから推測せず、AMD の互換性資料とログを確認します。Windows 版 ROCm が対応する GPU は、Linux 版より限定されます。

## モデル形式で 2 回失敗する

GPU を認識した後も、モデルの読み込みで失敗しました。原因は VRAM 容量ではなく、モデル形式とバックエンドの組み合わせです。

### コミュニティ製 GGUF

最初に、容量を抑えたコミュニティ製 GGUF を試しました。ComfyUI-GGUF が MiniMax H3 のアーキテクチャを認識できず、次のようなエラーになりました。

```text
ValueError: This gguf file is incompatible with llama.cpp!
Consider using safetensors or a compatible gguf file
```

GGUF という形式そのものが常に利用できないのではありません。MiniMax H3 の新しい構造と、それを読むカスタムノードの対応時期が合っていませんでした。変換済みファイルが存在しても、利用側が対応しているとは限りません。

### NVIDIA 向け NVFP4

公式ワークフローがデフォルトで指定したテキストエンコーダーは、NVFP4 量子化でした。これは NVIDIA の対応ハードウェアを前提とし、検証した ROCm 環境では動きませんでした。

最終的に、UNet とテキストエンコーダーを公式の`int8_convrot`版へそろえました。この形式は検証した ROCm バックエンドで利用でき、生成まで進みました。

モデルを選ぶときは、次をセットで確認します。

- モデルのアーキテクチャ
- 保存形式
- 量子化方式
- 読み込みノードの対応バージョン
- GPU バックエンドと対応命令
- 必要な VRAM と RAM

ファイル名に`official`や`quantized`とあっても、自分の GPU で動く保証にはなりません。

## 必要なモデルを再取得可能にする

モデル一式は約 50 GB です。Reference to Video 用も加えると、さらに約 20 GB 増えます。ComfyUI 本体とモデルを Git リポジトリへ含めず、セットアップスクリプトで取得します。

| 配置先 | モデル | おおよそのサイズ |
| :-- | :-- | --: |
| `models/diffusion_models/` | <span class="nowrap">MiniMax H3</span> `int8_convrot` | 19.5 GB |
| `models/text_encoders/` | <span class="nowrap">Qwen 3 VL</span> `int8_convrot` | 25.3 GB |
| `models/vae/` | <span class="nowrap">Video VAE FP16</span> | 4.9 GB |
| `models/vae/` | <span class="nowrap">Audio VAE FP32</span> | 0.6 GB |

大容量ダウンロードは途中で切断されます。`download_models.ps1`は、`curl -C -`を利用して中断位置から再開します。スクリプトを再実行しても、取得済みファイルを壊さない設計にします。

配布元のファイルは更新される可能性があります。再現性を重視するなら、ダウンロード URL だけでなく、ファイルサイズとハッシュも記録します。モデルのライセンスと利用条件も、取得時点のものを保存します。

## セットアップをスクリプトへ落とす

公開リポジトリは、次の役割でファイルを分けています。

| ファイル／ディレクトリ | 役割 |
| :-- | :-- |
| `README.md` | 目的、検証環境、全体構成 |
| `SETUP.md` | 手動手順と既知の問題 |
| `scripts/setup.ps1` | 仮想環境からモデル取得までの自動化 |
| `scripts/download_models.ps1` | 再開可能なモデル取得 |
| `workflow_template.json` | <span class="nowrap">ComfyUI</span> のワークフローひな型 |
| `.claude/skills/minimax-h3-video/` | エージェントから動画を生成する処理 |
| `examples/` | 生成できたワークフロー例 |

重みや ComfyUI のコピーを保存するのではなく、「どの版を、どの順序で、どこへ置くか」をコードにします。環境を壊したときに、PC へ残った状態を手作業で修復するより、仮想環境を作り直せます。

## エージェントから動画を生成する

MiniMax H3 は、動画プロンプトの作り方をまとめたスキルを公開しています。その考え方を利用し、Claude Code へ「この内容の動画を作る」と依頼すると、次の処理を行うスキルを用意しました。

1. 指示から MiniMax H3 向けのプロンプトを作る
2. ComfyUI サーバーが動いているか確認する
3. ワークフローへプロンプトと生成条件を設定する
4. ComfyUI API へジョブを投入する
5. 完了を待ち、出力ファイルを報告する

GUI で各ノードを調整する方が、表現を細かく制御できます。一方、同じひな型で短い動画を何度も試す用途では、自然言語から API までを自動化すると操作を減らせます。

エージェントへ外部から取得したスキルを導入するときは、内容を確認します。スクリプトはコマンド実行、ネットワーク接続、ファイル操作ができるため、通常のプロンプトより大きな権限を持ちます。

## サーバー停止を前提に回復する

長い動画や高い解像度を試すと、生成途中に ComfyUI のサーバープロセスは終了することがありました。原因は特定できていません。候補は VRAM と RAM、Windows の GPU タイムアウト、ROCm、ComfyUI です。

原因不明のまま「落ちないこと」を期待せず、生成スクリプトに回復処理を追加しました。

- サーバープロセスと API の応答を確認する
- モデル読み込み中の長い無応答と、終了を区別する
- 複数回確認してからサーバーを再起動する
- 同じジョブを再投入する
- 再試行回数を制限し、無限ループを避ける
- 失敗時のログと生成条件を保存する

再試行は原因を直しませんが、長時間処理の一時的な失敗から回復できます。同じ入力で毎回落ちる場合は再試行を止め、解像度、フレーム数、モデル、VRAM 使用量を調べます。

## 16 GB GPU でも試す

同じセットアップを Radeon RX 9060 XT 16 GB でも確認しました。1344×768、約 5 秒、20 steps の条件では、R9700 が約 5 分、RX 9060 XT が約 15 分でした。約 3 倍の差です。

この差は GPU の演算性能だけでなく、16 GB の VRAM にモデル全体が収まらず、ComfyUI が RAM との間でオフロードする影響を含むと推測しています。詳細な内訳は未計測です。結果を GPU 単体の性能差とは断定しません。

16 GB でも生成できたことは重要です。一方、待ち時間と RAM 使用量が増えます。短い低解像度の動画から始め、タスクマネージャーで Dedicated GPU memory、Shared GPU memory、システムメモリを記録します。

## まとめ

Windows の Radeon 環境で ComfyUI と MiniMax H3 を動かすには、ROCm 版 PyTorch、GPU ターゲット、量子化形式をそろえる必要がありました。GGUF と NVFP4 は読み込みに失敗しました。その後に`int8_convrot`版を選び、R9700 と RX 9060 XT で動画生成を確認しました。

セットアップとモデル取得を再実行可能なスクリプトにし、サーバー停止からの回復も自動化しました。次章では、この ROCm 7.2.1 の環境を ROCm 10.0.0 へ更新します。導入は簡潔になりますが、新しい互換性問題も発生します。
