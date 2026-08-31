---
class: content
title: llama.cpp と ComfyUI を ROCm 10 へ更新する
author: 江本光晴
profile: |
  モバイルアプリ開発者。自作 PC とローカル LLM の検証を趣味にしています。
---

<div class="doc-header">
  <div class="doc-title">llama.cpp と ComfyUI を ROCm 10 へ更新する</div>
  <div class="doc-author">江本光晴</div>
</div>

# llama.cpp と ComfyUI を ROCm 10 へ更新する

ROCm 10.0.0 では、Windows 向け PyTorch の配布方法が変わり、ComfyUI のセットアップを簡潔にできました。動画生成の実測時間も短くなりました。一方、動的 VRAM ローディングと Windows の Smart App Control で、新しい問題が発生しました。

本章では、ROCm 7.2.1 から 10.0.0 へ更新した差分を説明します。コマンドと結果は 2026 年 8 月 31 日時点です。AMD、PyTorch、ComfyUI の更新によって組み合わせは変わります。実行時は公開リポジトリの最新手順と AMD の公式ドキュメントも確認してください。[^rocm-update-blog] [^comfy-setup]

[^rocm-update-blog]: [llama.cpp と ComfyUI の環境を ROCm 10 に更新した](https://mthr.hatenablog.com/entry/2026/08/31/075504)
[^comfy-setup]: [ComfyUI-ROCm SETUP.md](https://github.com/mitsuharu/ComfyUI-ROCm/blob/master/SETUP.md)

## 更新前に比較条件を固定する

ROCm、PyTorch、ComfyUI、GPU ドライバーを一度に最新版へ変えると、性能差と問題の原因を特定できません。更新前に次を記録します。

- Windows と AMD ドライバーのバージョン
- Python、PyTorch、ROCm、ComfyUI のコミット
- GPU 名と`gfx`ターゲット
- モデルのファイル名、サイズ、ハッシュ
- ワークフロー JSON と生成条件
- 起動時間、モデル読み込み時間、生成時間
- VRAM と RAM の最大使用量
- 正常終了したログと、既知のエラーログ

既存の`.venv`を直接更新せず、新しい仮想環境を作ります。モデルは大きいため共有できますが、元の環境からも参照できる配置を保ちます。問題が起きたら、ROCm 7.2.1 の仮想環境へ戻します。

## ROCm 10 の導入方法

ROCm 7.2.1 では、複数の wheel URL と SDK パッケージを個別に指定しました。ROCm 10 は pip のパッケージインデックスとして公開され、`torch[device-all]`の依存関係としてランタイムと GPU アーキテクチャ別パッケージを取得できます。

検証した組み合わせは次のとおりです。

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip

.\.venv\Scripts\python.exe -m pip install `
  --retries 10 --timeout 60 `
  --index-url https://stable.repo.amd.com/rocm/whl-next/ `
  "torch[device-all]==2.13.0+rocm10.0.0" `
  "torchvision[device-all]==0.28.0+rocm10.0.0" `
  "torchaudio==2.11.0.2+rocm10.0.0"
```

`device-all`は、複数の GPU アーキテクチャ向けパッケージを取得します。ダウンロードは数 GB になるため、リトライ回数を増やしています。中断した場合は、pip のキャッシュを利用して同じコマンドを再実行します。

torch、torchvision、torchaudio は対応する組み合わせへそろえます。一部だけ更新すると、import 時にバージョン不整合が発生します。最新版の組み合わせと必要なドライバーは、AMD の Windows 向け PyTorch 導入資料で確認します。[^amd-pytorch]

[^amd-pytorch]: [Install PyTorch for Radeon GPUs on Windows](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/install/installrad/windows/install-pytorch.html)

## ComfyUI の依存関係を導入する

ROCm 10 のバージョン表記は、ComfyUI の`requirements.txt`が要求する PyTorch の条件を満たしました。検証時点では、汎用版 PyTorch へ上書きされず、ROCm 版を最後に入れ直す作業が不要になりました。

```powershell
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..
```

将来も上書きされない保証はありません。導入後に、必ず実体を確認します。

```powershell
.\.venv\Scripts\python.exe -c `
  "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.device_count())"
```

期待する例は、`2.13.0+rocm10.0.0 True 2`です。`+rocm10.0.0`が消えていたら、汎用版へ置き換わっています。

同じ仮想環境へ、複数の`pip install`を同時実行しません。検証中に並列実行し、環境を壊した経験があります。ダウンロードを急ぐ場合も、同じ`.venv`への書き込みは直列にします。

## ROCm 7.2.1 との差分

| 項目 | ROCm 7.2.1 | ROCm 10.0.0 |
| :-- | :-- | :-- |
| 配布 | 個別 wheel URL | pip インデックス |
| ランタイム | SDK 関連を明示 | `torch[device-all]`の依存 |
| 導入順 | ROCm 版 PyTorch を最後に再導入 | 検証時は再導入不要 |
| 起動オプション | 追加なし | `--disable-dynamic-vram`が必要 |
| Smart App Control | 断続的な影響 | 検証環境では import を阻止 |
| 起動時間 | 40〜60 秒 | 約 15 秒 |
| ComfyUI の ROCm 表示 | `(7, 2)` | `(7, 15)` |

ROCm 10.0.0 でも、ComfyUI のログが`ROCm version: (7, 15)`と表示しました。これは参照する HIP ランタイムのバージョン表示であり、インストールに失敗して 7 系へ戻ったという意味ではありません。PyTorch のバージョン、パッケージ一覧、実際に読み込んだ DLL も合わせて判断します。

## 動的 VRAM ローディングを無効にする

ROCm 10 で ComfyUI を通常起動すると、モデルの読み込み時に次のエラーで失敗しました。

```text
aimdo: CUDA API FAILED (719): err = cuMemMap(...): unspecified launch failure
aimdo: VRAM Allocation failed (non OOM)
CUDA error: unspecified launch failure (hipErrorLaunchFailure)
```

メモリ不足を表す OOM ではありません。ComfyUI の動的 VRAM ローディングが利用する仮想メモリマッピングを、検証した ROCm 10 の HIP ランタイムで実行できませんでした。

起動時に`--disable-dynamic-vram`を指定すると、従来の推定に基づくモデル読み込みへ戻り、生成できました。

```powershell
.\.venv\Scripts\python.exe ComfyUI\main.py --disable-dynamic-vram
```

R9700 の 32 GB VRAM では、検証したワークフローを実行できました。VRAM の少ない GPU は、動的ローディングを無効にした影響を受ける可能性があります。16 GB の ROCm 10 環境では未検証です。第 6 章の ROCm 7.2.1 で動いた結果を、そのまま適用しません。

## Smart App Control のブロック

Windows 11 の Smart App Control が、ROCm 10 とともに導入したネイティブバイナリをブロックしました。検証環境では、`torch/lib/dl.dll`を読み込めず、`import torch`の時点で失敗しました。

```text
OSError: [WinError 4551]
アプリケーションコントロールポリシーによって
このファイルがブロックされました。
```

Microsoft Defender のウィルス対策除外へ仮想環境を追加しても解消しませんでした。Smart App Control と Defender の除外は別の仕組みです。ブロックの記録は、イベントビューアーの`Microsoft-Windows-CodeIntegrity/Operational`にあるイベント ID 3077 や 3033 で確認できました。

Smart App Control の無効化で実行できました。ただし、これは PC のセキュリティ状態を変更する操作です。検証だけを理由として、即座に無効化せず次の順で判断します。

1. イベントログでブロック対象を特定する
2. AMD と Microsoft の最新資料で既知の問題を確認する
3. ROCm 7.2.1 へ戻す選択肢を検討する
4. 専用の検証機、Windows Sandbox、仮想マシンへ分離できるか検討する
5. 組織が管理する端末では、管理者とセキュリティ担当へ確認する
6. 変更する場合は、再度有効にできる条件と影響を確認する

Smart App Control は、Windows のバージョンや端末の状態によって、無効化後に簡単に再有効化できない場合があります。本書の検証機で切り替えられた結果だけを根拠にしません。安全性を優先するなら、ROCm 7.2.1 を継続利用します。

## 生成速度を比較する

Radeon AI PRO R9700、864×480、20 steps で、同じワークフローを比較しました。

| 動画の長さ | フレーム数 | ROCm 7.2.1 | ROCm 10.0.0 | 短縮率 |
| :-- | --: | --: | --: | --: |
| 約 5 秒 | 124 | 322 秒 | 280 秒 | 13％ |
| 約 15 秒 | 362 | 1860 秒 | 1250 秒 | 33％ |

短い動画では、モデルの読み込み時間が全体に占める割合が大きく、差が小さくなりました。長い動画ではサンプリング処理の割合が増え、ROCm 10 の短縮効果が大きく現れたと考えられます。

これは 1 台、1 モデル、各条件の実測です。十分な回数を用いた統計的なベンチマークではありません。更新の判断には、速度だけでなく、起動成功率、長時間生成の完走率、セキュリティ設定の変更も含めます。

## llama.cpp ビルダーも ROCm 10 に対応する

第 4 章のビルダーは、ROCm 7.14.0 と 10.0.0 を選択できるようにしました。7.14 系は従来の multi-arch wheel インデックス、10 系は TheRock の新しい stable インデックスを利用します。

バージョン選択をトップレベルの入力として共有し、次へ引き継ぎます。

- SDK のセットアップ
- GitHub Actions のキャッシュキー
- 成果物 ZIP の名前
- GitHub Release の情報

異なる ROCm のキャッシュと DLL を混在させないことが重要です。成果物名にバージョンを含めても、キャッシュキーが同じなら古い中間生成物を使う可能性があります。

ROCm 10 では、従来の`rocblas/library`ではなく`.kpack`形式のデバイスカーネルを利用する構成があります。パッケージ処理は両方を探し、どちらもない場合は ZIP 作成を失敗させます。新しい SDK へ追従するときは、ビルドコマンドだけでなく、ランタイムの収集方法も更新します。

## 更新を採用するか判断する

ROCm 10 は、セットアップの簡潔さ、起動時間、動画の生成速度で改善しました。一方、検証環境では次の条件が付きました。

- ComfyUI に`--disable-dynamic-vram`が必要
- Smart App Control が PyTorch の import をブロック
- 16 GB GPU での影響は未検証
- 新しいパッケージ配布と`.kpack`への対応が必要

速度が 13〜33％向上しても、セキュリティ機能の変更や未検証範囲が許容できなければ、更新しません。古い環境をすぐ削除せず、同じモデルとワークフローで並行運用します。

## まとめ

ROCm 10 では、PyTorch とランタイムを pip の依存関係として導入でき、ROCm 7.2.1 よりセットアップが簡潔になりました。R9700 の動画生成も短くなりました。一方、動的 VRAM ローディングを無効にする必要があり、Smart App Control との互換性問題が発生しました。

更新は、バージョン番号を上げる作業ではありません。正常系、失敗ログ、性能、セキュリティへの影響を比較し、戻せる状態で採用します。次章では、本書全体の経験をもとに、問題の切り分けと継続運用の形をまとめます。
