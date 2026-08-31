# 「Windows + Radeon で育てるローカル LLM 環境」編集アウトライン

## 本書の狙い

個人が Windows と自作 PC を使ってローカル LLM 環境を構築し、用途に応じて拡張・運用するまでを一続きの実践記としてまとめる。単一の正解を示すのではなく、VRAM 容量、予算、対応ソフトウェア、安定性の間でどう判断したかを残す。

想定読者は、ローカル LLM に興味がある自作 PC 初心者、Radeon GPU を活用したい開発者、生成 AI の処理をクラウドから切り離したいモバイルアプリ開発者とする。

## 掲載順と役割

| 章 | ファイル | 役割 | 主な参照元 |
| :-- | :-- | :-- | :-- |
| 1 | `01_local_llm_overview.md` | ローカル LLM の利点と限界、用語、全体構成を共有する | iOSDC 2026 原稿、Qiita 検証機記事 |
| 2 | `02_build_local_llm_pc.md` | モデルから必要な VRAM／RAM を逆算し、検証機を設計する | Qiita 検証機記事、iOSDC 2026 原稿 |
| 3 | `03_add_gpu_with_oculink.md` | 内部スロットが足りない PC に GPU を増設し、帯域と安定性を考える | OCuLink ブログ記事 |
| 4 | `04_build_llama_cpp_windows.md` | Windows ネイティブの llama.cpp を再現可能にビルド・配布する | llama.cpp ブログ記事、`llama.cpp-windows-gpu-builder` |
| 5 | `05_connect_xcode.md` | 推論用 PC を LAN 内サーバーにして Xcode から利用する | iOSDC 2026 原稿 |
| 6 | `06_comfyui_minimax_h3.md` | Radeon 上で ComfyUI と MiniMax H3 を動かし、エージェントから自動化する | ComfyUI ブログ記事、`ComfyUI-ROCm` |
| 7 | `07_upgrade_rocm10.md` | ROCm 7.2.1 から 10.0.0 へ移行し、性能と互換性を検証する | ROCm 10 更新記事、`ComfyUI-ROCm`、`llama.cpp-windows-gpu-builder` |
| 8 | `08_operations_and_troubleshooting.md` | 問題を層ごとに切り分け、更新可能な検証環境として保守する | 全参照元を横断した追記 |

## 再編集の方針

- Qiita のパーツ紹介は、製品カタログではなく選定基準を中心に再構成する。
- OCuLink 記事は NVIDIA 環境の事例だが、PCIe 帯域と増設手段を学ぶ章として Radeon 検証機の前後に接続する。
- llama.cpp と ComfyUI は目的が異なるため、推論と動画生成の環境を分けて説明する。
- iOSDC 原稿の基礎説明とハードウェア比較は第 1、2 章へ移し、Xcode 固有の手順を第 5 章へ集約する。
- ROCm 10 の手順は 2026 年 8 月 31 日時点のスナップショットとして記載し、最新版確認先を併記する。

## 今後、追加を検討したい内容

- 消費電力、騒音、待機時電力を含めた月間運用コストの実測
- 同一モデル・同一プロンプトによる CUDA／ROCm／Vulkan の比較
- モデル形式、量子化、コンテキスト長と VRAM 使用量の対応表
- LAN 内 API の認証、ファイアウォール、TLS、複数ユーザー利用の設計
- 生成物とモデルライセンス、入力データの取り扱いを整理した章
- 温度、GPU 使用率、推論速度、サーバー死活の継続的な監視方法
- 再現用スクリプトの Windows Sandbox／仮想マシンでの検証記録
