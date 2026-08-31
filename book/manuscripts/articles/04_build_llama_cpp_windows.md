---
class: content
title: Windows 向け llama.cpp を再現可能にビルドする
author: 江本光晴
profile: |
  モバイルアプリ開発者。自作 PC とローカル LLM の検証を趣味にしています。
---

<div class="doc-header">
  <div class="doc-title">Windows 向け llama.cpp を再現可能にビルドする</div>
  <div class="doc-author">江本光晴</div>
</div>

# Windows 向け llama.cpp を再現可能にビルドする

Windows と Radeon GPU 2 枚の検証機では、Ollama なら推論できるのに、別のアプリケーションでは失敗する状態が続きました。推論途中に文字化けして止まる、モデルを VRAM へ読み込む途中で PC がクラッシュする、GPU が無効になり再起動後にデバイスマネージャーから有効化する、といった症状です。

同じモデルと GPU でもアプリケーションによって結果が違うなら、モデルの問題だけではありません。アプリケーションが内蔵する llama.cpp のバージョン、ビルド設定、ROCm ランタイムを比較する必要があります。本章では、Windows x64 向けの llama.cpp を GitHub Actions でビルドし、実行に必要なランタイムを ZIP へまとめます。作成した環境は GitHub で公開しています。[^builder-repository]

[^builder-repository]: llama.cpp Windows GPU Builder https://github.com/mitsuharu/llama.cpp-windows-gpu-builder

## Ollama だけが動く状態から調べる

最初に、動いている Ollama の構成を手がかりにしました。Windows の ROCm 環境では、Ollama が GPU 間の peer copy を無効にする設定を利用していました。また、PC 全体へ ROCm SDK をインストールしなくても動くように、実行に必要なランタイムをアプリケーションとともに配布しています。

一方、ほかのアプリケーションがどの設定で llama.cpp をビルドしているかは、画面から分かりません。そこで、次の仮説を立てました。

1. 異なる PCIe 接続幅の Radeon 間で、peer copy が不安定になっている
2. ビルド時と実行時の ROCm ランタイムが一致していない
3. GPU アーキテクチャに必要なカーネルが配布物に含まれていない

この仮説を一つずつ検証できるように、ビルド設定と配布物を自分で管理します。背景となった調査はブログにもまとめています。[^build-blog]

[^build-blog]: Windows + マルチ Radeon GPU 向けに llama.cpp をビルドする https://mthr.hatenablog.com/entry/2026/08/25/190317

## ビルドの方針

公開リポジトリでは、NVIDIA CUDA、AMD ROCm／HIP、Vulkan の 3 バックエンドを扱います。本書の中心は ROCm ですが、同じ llama.cpp のソースで結果を比較できるように、ほかのバックエンドも残しています。

設計方針は次のとおりです。

- llama.cpp のソースを Git submodule のコミットで固定する
- ビルドは使い捨ての Windows runner で行う
- ROCm では GPU ターゲットを明示する
- CUDA と ROCm で peer copy を無効にする
- ROCm の実行 DLL とデバイスカーネルを ZIP に同梱する
- 成果物名にバージョンと GPU ターゲットを含める
- 更新前の成果物へ戻せるように GitHub Releases へ保存する

ローカル PC に複数の SDK を入れ替えるより、使い捨て runner の方がビルド環境を再現しやすくなります。検証機の Windows を再インストールしても、同じ ZIP を取得すれば推論環境を戻せます。

## peer copy を無効にする

複数 GPU 間の peer copy は、CPU メモリを経由せず、GPU から GPU へデータを直接転送します。対応する構成では高速です。一方、GPU の種類や PCIe の接続構成が異なると、正しさや安定性の問題が起こる場合があります。

本リポジトリは、次の CMake オプションを有効にします。

```text
GGML_CUDA_NO_PEER_COPY=ON
```

名前に `CUDA` が含まれますが、llama.cpp の ROCm バックエンドにも適用されます。これはマルチ GPU を無効にする設定ではありません。モデルのレイヤーは複数 GPU へ配置できますが、GPU 間の直接転送を利用しません。

ROCm のビルドスクリプトでは、ほかの設定とともに次のように指定します。

```powershell
cmake -S $source -B $build -G 'Unix Makefiles' `
    -DCMAKE_BUILD_TYPE=Release `
    -DGGML_HIP=ON `
    -DGGML_CUDA_NO_PEER_COPY=ON `
    -DGGML_HIP_NO_VMM=ON `
    -DGGML_HIP_ROCWMMA_FATTN=ON `
    -DGGML_NATIVE=OFF `
    -DGGML_BACKEND_DL=ON `
    "-DAMDGPU_TARGETS=$GpuTarget"
```

peer copy を無効にすると、最高速度を失う可能性があります。採用理由は高速化ではなく、筆者のマルチ Radeon 環境での安定性です。すべての GPU 構成に必要な設定ではありません。まず既定値を試し、不安定な構成との比較条件として利用します。

## ROCm ランタイムを ZIP に含める

公式 llama.cpp の Windows 向け ROCm ビルドは、実行 PC 側へ対応する ROCm 環境を用意する方式があります。しかし、PC 全体へ ROCm のパスや環境変数を設定すると、すでに動いている Ollama や Python 環境へ干渉する可能性があります。ビルド時と異なるバージョンの DLL が先に読み込まれる問題も起こります。

そこで、実行に必要なファイルを同じ ZIP へ集めます。

- `llama-cli.exe`、`llama-server.exe`、`llama-bench.exe` などの実行ファイル
- `ggml-hip.dll` と llama.cpp の共有ライブラリ
- `amdhip64*.dll`、`hipblas.dll`、`rocblas.dll` などの依存 DLL
- GPU ターゲット別の `rocblas` カーネル、または `.kpack`
- ROCm、llama.cpp、ビルダーのライセンス
- 一時的に PATH を設定して起動する `Run-Rocm.ps1`

配布スクリプトは DLL の依存関係をたどり、必須ファイルが足りなければ ZIP 作成を失敗させます。ビルドが成功しただけでは、別 PC で動く配布物になったとは限りません。ランタイムとデバイスカーネルを検証する処理が必要です。

AMD のグラフィックドライバーは ZIP に含めません。実行 PC には、対象 GPU と ROCm の組み合わせに対応する AMD ドライバーが必要です。

## GPU ターゲットを選ぶ

ROCm 版は、GPU のアーキテクチャコードを指定してビルドします。リポジトリで選べる主な値は次のとおりです。

| ターゲット | 主な対応ハードウェアの例 |
| :-- | :-- |
| `gfx1100` | Radeon RX 7900 シリーズ |
| `gfx1101` | Radeon RX 7800 XT、RX 7700 XT |
| `gfx1150` | 一部の Ryzen AI 300 APU |
| `gfx1151` | 一部の Ryzen AI Max APU |
| `gfx1200` | Radeon RX 9060 シリーズ |
| `gfx1201` | Radeon AI PRO R9700 |

同じ製品シリーズでもターゲットが異なる場合があります。表だけで決めず、AMD の最新互換性資料と実機の情報を確認します。Windows 版 ROCm の対応範囲は、Linux 版と同じではありません。

## GitHub Actions でビルドする

リポジトリを fork するか、自分のリポジトリへ配置した後、Actions の手動実行画面からバックエンドを選びます。llama.cpp は、安定版、nightly／開発版、`master` の最新コミットを選択できます。

| 種類 | タグ未指定時 | 明示例 |
| :-- | :-- | :-- |
| `release` | 最新の安定版 | `v0.2.0` |
| `nightly` | 最新の nightly／開発版 | `b10603` |
| `latest-branch` | `origin/master` の最新コミット | タグ指定不可 |

ビルド結果は、ワークフローの Artifact と、設定した場合は GitHub Release へ保存されます。Artifact 名には、バックエンド、llama.cpp のバージョン、ツールチェーンのバージョン、ROCm の GPU ターゲットが含まれます。

Git submodule を更新するときは、安定版と nightly を区別します。更新スクリプトは、存在しないタグ、形式が合わないタグ、submodule 内の未コミット変更を検出して中止します。

```powershell
# 最新の安定版へ更新
.\scripts\Update-LlamaCpp.ps1

# 特定の安定版へ更新
.\scripts\Update-LlamaCpp.ps1 -Release v0.2.0

# 最新の nightly へ更新
.\scripts\Update-LlamaCpp.ps1 -LatestNightly
```

「最新」を毎回ビルドするだけでは、問題が起きた版を特定できません。正常に動いた submodule のコミットと成果物を残し、更新後に同じ試験を実行します。

## ローカルで ROCm 版をビルドする

ローカルビルドには CMake、GNU Make、Windows 向け ROCm／HIP SDK が必要です。TheRock の wheel を利用する方式にも対応します。ツールチェーンを有効にして `HIP_PATH` を設定し、Developer PowerShell から実行します。

```powershell
git clone --recurse-submodules `
  https://github.com/mitsuharu/llama.cpp-windows-gpu-builder.git
cd llama.cpp-windows-gpu-builder

.\scripts\Build-Rocm.ps1 -GpuTarget gfx1201
```

WSL や Docker の Linux コンテナでビルドした成果物は、Linux バイナリです。Windows ネイティブの実行ファイルが必要なら、Windows のツールチェーンでビルドします。ローカル PC の汚染を避けたい場合は、Windows Sandbox や仮想マシンも選択肢です。

## 配布 ZIP を実行する

ZIP を展開したら、最初に GPU の一覧を確認します。

```powershell
.\Run-Rocm.ps1 -Executable llama-cli.exe -- --list-devices
```

次に、小さい GGUF モデルを指定して GPU へオフロードします。`-ngl 99` は、可能な限り多くのレイヤーを GPU へ置く指定です。

```powershell
.\Run-Rocm.ps1 -Executable llama-cli.exe -- `
  -m C:\models\model.gguf -ngl 99
```

ベンチマークでバックエンドと速度を記録します。

```powershell
.\Run-Rocm.ps1 -Executable llama-bench.exe -- `
  -m C:\models\model.gguf -ngl 99 -p 128 -n 128
```

CPU 推論でもコマンド自体は動きます。成功メッセージだけで判断せず、デバイス一覧、起動ログ、ベンチマークの `backend`、GPU 使用率を確認します。

## アプリケーションへ組み込む

カスタム llama.cpp を指定できるアプリケーションなら、展開したディレクトリを選びます。筆者は、対応するデスクトップアプリからビルド済み llama.cpp を指定し、マルチ Radeon 環境で推論できることを確認しました。

アプリケーションが llama.cpp を固定で同梱し、差し替えられない場合は、`llama-server.exe` を独立して起動します。クライアントは OpenAI 互換 API へ接続します。この方法なら、UI と推論エンジンの更新を分けられます。

API を LAN へ公開するときは、既定の認証と待ち受けアドレスを確認します。認証なしでインターネットへ公開しません。Windows ファイアウォールの許可範囲をプライベートネットワークと必要な端末へ限定します。

## 問題が起きたときの確認

| 症状 | 最初に確認する項目 |
| :-- | :-- |
| GPU が一覧にない | ドライバー、GPU ターゲット、`Run-Rocm.ps1` のログ |
| CPU だけで動く | `-ngl`、`ggml-hip.dll`、実行時 DLL の読み込み |
| 起動時に DLL エラー | ZIP の展開漏れ、Smart App Control、別 ROCm の PATH |
| 1 枚だけ認識する | デバイスマネージャー、PCIe、電源、対象 GPU の対応 |
| 複数 GPU で停止する | peer copy 有無、GPU ごとの割り当て、モデルサイズ |
| 更新後だけ失敗する | llama.cpp、ROCm、ドライバーの各バージョン差分 |

まず `llama-cli.exe --list-devices` と小さいモデルで確認し、UI アプリと大きいモデルを後から追加します。複数の要因を同時に変えません。

## まとめ

Windows とマルチ Radeon の不安定さに対して、peer copy を無効にした llama.cpp をビルドし、ROCm ランタイムと GPU カーネルを ZIP へ同梱しました。これにより、ビルド設定と実行環境を固定し、既成アプリとは独立して問題を再現できます。

次章では、この推論環境を LAN 内のサーバーとして起動し、Xcode からコード生成に利用します。
