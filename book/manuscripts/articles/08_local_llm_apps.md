---
class: content
title: ローカル LLM の実行アプリは何が違うか
author: 江本光晴
profile: |
  モバイルアプリ開発者。自作 PC とローカル LLM の検証を趣味にしています。
---

<div class="doc-header">
  <div class="doc-title">ローカル LLM の実行アプリは何が違うか</div>
</div>

# ローカル LLM の実行アプリは何が違うか

<aside class="publication-note">
  <div class="publication-note-label">Information</div>
  <div class="publication-note-text">これは 2026 年 10 月 9 日に Qiita で掲載しました。適宜、加筆修正しています。</div>
  <div class="publication-note-url">掲載元：https://qiita.com/mitsuharu_e/items/f996104ba650a4e2c83c</div>
</aside>

<!-- textlint-disable -->

普段は Ollama、LM Studio や Unsloth Desktop を使って、ローカル LLM を実行しています。これら以外にも LM Studio Bionic、AnythingLLM や OpenCode など、ローカル LLM を利用できるアプリもあります。

ここで Ollama はモデルを実行するためのアプリですが、OpenCode はモデルにコードを調べたり修正させたりできます。AnythingLLM は文書を検索して回答する用途にも使えます。どれも LLM を実行するアプリですが、役割が異なります。

そこで LLM を実行するアプリを調べて、役割を整理しました。数が多く、知らないアプリもあったので、ChatGPT に特性などをまとめて調べてもらいました。
また、中にはバックエンドを変更できるアプリもあります。そこで、同じモデル・推論サーバーを使って、アプリ（エージェント、ハーネス）によって結果が変わるのかを確認しました。計測環境の構築、試験実行や集計は、公平を期すため Codex を依頼しました。

## ローカル LLM を実行するアプリの種類

ローカル LLM の実行アプリでも、アプリによって役割が異なります。今回は４種類に整理しました。次表での記号は、その後のアプリ紹介でも利用します。１つのアプリが複数の役割を持つ場合は、たとえば「📦 💬」のように併記します。

| 記号 | 分類 | 主な役割 | 代表例 |
| :-- | :-- | :-- | :-- |
| ⚙️ | 推論エンジン | GPUやCPUでモデルの計算そのものを実行 | llama.cpp、vLLM、Strata、MLX |
| 📦 | モデル実行・管理アプリ | モデル取得、推論設定、APIサーバー提供 | Ollama、LM Studio、Unsloth Desktop、GPT4All |
| 💬 | チャット・文書検索 | 会話、文書を利用した回答 | AnythingLLM、Open WebUI、Cherry Studio |
| 🛠️ | AIエージェント | ファイル編集、コマンド実行、テストなどを自律的に実行 | OpenCode、Claude Code、LM Studio Bionic |

この分類で注意したいのは、📦 のアプリは内部で ⚙️ の推論エンジンを利用しています。たとえば Ollama や LM Studio は llama.cpp をバックエンドに採用しています。なお、同じ llama.cpp 系のアプリでも、組込されたバージョンやビルドオプション設定などが異なるため、性能まで同じになるとは限りません。

### ⚙️ 推論エンジン

推論エンジンはモデルの重みを読み込み、CPUやGPUでトークンを計算するソフトウェアです。ここでは Ollama や LM Studio のような管理アプリとは分けて紹介します。

| 推論エンジン・基盤 | 特徴 |
| :-- | :-- |
| [llama.cpp](https://github.com/ggml-org/llama.cpp) | GGUF形式のモデルを幅広いCPU・GPUで実行。CUDA、ROCm、Vulkanなどに対応。llama-server で API 公開もできる |
| [vLLM](https://github.com/vllm-project/vllm) | 複数リクエストの処理に強い高スループットの推論サーバー |
| [Strata](https://github.com/Niko1221/Strata) | GPUのVRAMとシステムRAMを活用し、大規模MoEモデルの実行を狙う独自推論システム |
| [MLX LM](https://github.com/ml-explore/mlx-lm) | Apple Silicon向けMLXを用いたLLM推論ライブラリ |
| [SGLang](https://github.com/sgl-project/sglang) | LLMのサービングや推論処理を最適化するフレームワーク |
| [LMDeploy](https://github.com/InternLM/lmdeploy) | TurboMindなどを備える推論・配信ツールキット |
| [ONNX Runtime GenAI](https://github.com/microsoft/onnxruntime-genai) | ONNX形式の生成AIモデルを実行するランタイム |
| [Transformers](https://github.com/huggingface/transformers) | 多数のモデルを動かせる汎用ライブラリ。推論専用エンジンとは性格が異なる |

有名なのは llama.cpp でしょう。最近気になっているのがStrataです。大規模MoEモデルを一般的なPCで使うための独自実装を備えています。今回は llama.cpp と Strata の推論性能は比較しません。

### 📦 モデル実行・管理アプリ

モデルのダウンロード、読み込み、GPU 設定、API サーバー起動などをまとめて扱えるアプリです。おそらく、初めてローカル LLM を実行するとなったら、まずはこれらから選択されるでしょう。チャット UI もあるものには 💬 を併記しています。

| アプリ | 分類 | 主な特徴・推論基盤 |
| :-- | :-- | :-- |
| [Ollama](https://ollama.com/) | 📦 💬 | 主に CLI でモデル取得・管理、API 提供。GUI もあるが機能は少ない。llama.cpp 系の推論基盤を利用 |
| [LM Studio](https://lmstudio.ai/) | 📦 💬 | GUI によるモデル管理と推論設定。GGUF ではllama.cpp 系、Apple Silicon では MLX も利用 |
| [Unsloth Desktop](https://unsloth.ai/) | 📦 💬（一部🛠️） | ローカルチャット、GGUF 推論、モデルのファインチューニングやエージェント連携。GGUF 実行に llama.cpp 系を利用 |
| [Jan](https://jan.ai/) | 📦 💬 | オープンソースのデスクトップアプリ。ローカルとクラウドのモデルを統合 |
| [GPT4All](https://www.nomic.ai/gpt4all) | 📦 💬 | オフラインチャットと LocalDocs による文書検索。llama.cpp 系を利用 |
| [KoboldCpp](https://github.com/LostRuins/koboldcpp) | 📦 💬 | llama.cpp 派生。GGUF 実行や専用 Web UI、生成設定を提供 |
| [text-generation-webui](https://github.com/oobabooga/text-generation-webui) | 📦 💬 | Web UI で複数のローダーや生成設定を選択可能 |
| [LocalAI](https://localai.io/) | 📦 | 複数の推論バックエンドでモデルを提供するセルフホスト型 API サーバー |
| [llamafile](https://github.com/Mozilla-Ocho/llamafile) | 📦 | モデルと実行環境をまとめ、配布や起動を簡素化する仕組み |

個人的によく利用するのは Ollama、LM Studio、Unsloth Desktop です。いずれもモデルを扱いやすいです。最近はもっぱら Unsloth Desktop をよく利用しています。

これらは llama.cpp 系ですが、同梱される llama.cpp は異なるため、同じモデルでも同じ推論速度になるとは限りません。体感的に Ollama は安全に振った設計の印象です（そのためか、みんなから遅いと言われる）。また、Unsloth Desktop は自作ビルドの llama.cpp を利用することができます。

### 💬 チャット・文書検索アプリ

こちらはモデルをどう利用するかに重点があります。推論処理そのものは Ollama や llama-server など、ほかのアプリ・サーバーに任せることもできます。

| アプリ | 分類 | 特徴 |
| :-- | :-- | :-- |
| [AnythingLLM](https://anythingllm.com/) | 💬 🛠️ | 文書取り込み、RAG、ワークスペース、エージェント機能 |
| [Open WebUI](https://openwebui.com/) | 💬 🛠️ | Ollama や OpenAI 互換 API に接続する Web UI。RAG やツール機能も提供 |
| [Cherry Studio](https://cherry-ai.com/) | 💬 | ローカルとクラウドのモデルを一つの画面で利用。モデル切替や MCP に対応 |
| [Msty](https://msty.ai/) | 💬 | 複数モデルを使ったチャットやナレッジ管理 |
| [LobeHub](https://lobehub.com/) | 💬 🛠️ | チャット、ナレッジ管理、エージェント機能 |
| [LibreChat](https://www.librechat.ai/) | 💬 🛠️ | セルフホスト型のマルチモデルチャットとエージェント |
| [Chatbox AI](https://github.com/Bin-Huang/chatbox) | 💬 | API 接続が中心のシンプルなチャットクライアント |
| [SillyTavern](https://github.com/SillyTavern/SillyTavern) | 💬 | キャラクター会話やプロンプトを細かく制御 |
| [Page Assist](https://github.com/n4ze3m/page-assist) | 💬 | ブラウザー拡張からローカル LLM を利用 |
| [Enchanted](https://github.com/gluonfield/enchanted) | 💬 | Apple 系デバイス向けのOllamaクライアント |

RAG は、Retrieval-Augmented Generation（検索拡張生成）の略です。質問に関連する文書を検索し、その内容をLLMに渡して回答させる技術です。PDF を読み込ませて内容を尋ねるような用途に使えます。

たとえば、Ollama 自体は Web 検索機能を持ちませんが、AnythingLLM は検索機能を持って、ChatGPT のチャットのように分からないことは調べてくれます。

### 🛠️ AIエージェント

チャットの返答にとどまらず、ファイルを読んで書き換えたり、コマンドやテストを実行したりするアプリです。今回はこの分類のうち OpenCode と Claude Code を測定しました。

| アプリ | 分類 | 特徴 |
| :-- | :-- | :-- |
| [OpenCode](https://opencode.ai/) | 🛠️ | CLI・デスクトップで利用できるマルチモデル対応のコーディングエージェント |
| [Claude Code](https://code.claude.com/docs/) | 🛠️ | ここで挙げるかは悩んだが、フロンティアモデル。バックエンドにローカル LLM も利用可能なので掲載。コード調査・編集・テストとなんでもできる |
| [LM Studio Bionic](https://lmstudio.ai/blog/introducing-lm-studio-bionic) | 💬🛠️ | LM Studio のモデルなどを利用した文書・コード作業向けエージェント |
| [Cline](https://cline.bot/) | 🛠️ | VS Code 上でファイル編集やコマンド実行 |
| [Roo Code](https://roocode.com/) | 🛠️ | VS Code 統合、複数の開発モード |
| [Kilo Code](https://kilocode.ai/) | 🛠️ | IDE・CLI などで利用できるコーディングエージェント |
| [Aider](https://aider.chat/) | 🛠️ | ターミナルとGitを中心としたコード編集 |
| [Goose](https://block.github.io/goose/) | 🛠️ | デスクトップ・CLI に対応した汎用エージェント、MCP拡張 |
| [Continue](https://continue.dev/) | 🛠️ | IDE 内のコード補完、編集、エージェント機能 |
| [OpenHands](https://docs.all-hands.dev/) | 🛠️ | 自律的なソフトウェア開発・テスト |
| [Codex CLI](https://developers.openai.com/codex/) | 🛠️ | ターミナル型のコードエージェント。対応するローカルモデルに接続可能 |
| [SWE-agent](https://github.com/SWE-agent/SWE-agent) | 🛠️ | ソフトウェア Issue の修正を扱う研究・開発向けエージェント |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | 🛠️ | Nous Research 製のオープンソース AI エージェント。コード編集、コマンド実行、Web 操作、スキルの自動生成・改善に対応。ローカル LLM やクラウド LLM を切り替えて利用できる |

💬 や 🛠️ のアプリは必ずしも自分自身でモデルを推論しません。例えば OpenCode と Claude Code は、ローカルの推論サーバーに接続できます。

ここで気になったのは、推論エンジンが同じでも、エージェントによって修正の結果や処理時間は変わるのか。そこで、OpenCodeとClaude Code に対して、モデルと推論サーバーを固定して比較してみました。

## 検証環境

LLM のモデルや llama.cpp など推論エンジン同士の性能比較ではありません。OpenCode と Claude Code が同じ llama-server に接続して、エージェント（ハーネス）の推論結果を調べます。

| 項目 | 検証環境 |
| :-- | :-- |
| OS | Windows 11 Home（10.0.26200） |
| CPU | Intel Core i7-13700F（16コア、24スレッド） |
| メモリ | 64GiB相当（32GiB × 2、5600 MT/s） |
| GPU | NVIDIA GeForce RTX 5070 Ti（16GB） |
| 推論エンジン | `llama.cpp b11495`（37ac63456） |
| モデル | Qwen3.8-27B-Q4_K_M.gguf |
| 量子化 | Q4_K_M |
| コンテキスト長 | 32,768トークン |
| 出力上限 | 4,096トークン |
| OpenCode | 1.18.35 |
| Claude Code | 2.1.293 |

モデルの GGUF ファイルは SHA-256 で同一性を管理しました。推論サーバーも同じバイナリを使用しています。要求ごとのキャッシュはコールド条件です。

各エージェントは同じモデルを呼び出しますが、OpenCode は OpenAI 互換 API、Claude Code は Anthropic 互換 API を使用します。そのため、今回は同じLLMへの完全に同一なリクエストの比較ではありません。

## 検証方法

題材は Node.js / TypeScript で作成した小規模プロジェクトです。各課題の初期状態を揃え、同じ依頼文を OpenCode と Claude Code に渡しました。

| 課題 | 内容 | 主な評価点 |
| :-- | :-- | :-- |
| T1 | 境界条件を含む clamp 関数の修正 | 範囲の端の扱い |
| T2 | Map を使う処理の実装 | キーの同値性、先頭要素、順序 |
| T3 | 割引計算の修正 | 小数の割引率、丸め、入力検証 |
| T4 | 時間表記のパーサー実装 | 空白の省略、表記揺れ、大きな整数 |
| T5 | 重複した集約処理のリファクタリング | 共通化と既存動作の維持 |

各課題を５回ずつ、２アプリで合計 50 回実行しました。公開テストと、エージェントには見せない非公開テストで評価します。T5では重複処理が実際に共通化されたかも確認しています。

今回は正常終了も成功条件としました。コードそのものがテストに通っていても、エージェントがタイムアウトした場合は失敗として扱います。タイムアウトは 600秒で、集計の分母と所要時間に含めています。

## 検証結果

OpenCode が成功数で１回多く、平均所要時間も 2.7 秒速い結果でした。ただし、25 回の試行で成功数の差は１回です。今回の結果だけで OpenCode の方が常に正確、あるいは速いとは言えません。

| 指標 | OpenCode | Claude Code |
| :-- | :-- | :-- |
| 成功数 | 21/25 | 20/25 |
| 成功率 | 84% | 80% |
| タイムアウト | 0回 | 2回 |
| 平均所要時間 | 218.7秒 | 221.4秒 |
| 所要時間の中央値 | 146.9秒 | 150.1秒 |
| APIエラー | 0件 | 4件 |

### 課題ごとの結果

簡単な課題では両者とも安定していました。T1・T2・T5は、どちらも５回すべて成功しています。

| 課題 | OpenCode 成功 | Claude Code 成功 | OpenCode 平均 | Claude Code 平均 |
| :-- | :-- | :-- | :-- | :-- |
| T1 | 5/5 | 5/5 | 134.8秒 | 144.0秒 |
| T2 | 5/5 | 5/5 | 129.7秒 | 137.5秒 |
| T3 | 5/5 | 4/5 | 235.8秒 | 216.1秒 |
| T4 | 1/5 | 1/5 | 448.9秒 | 480.5秒 |
| T5 | 5/5 | 5/5 | 144.2秒 | 128.6秒 |

T3 では Claude Code が１回失敗しました。割引率を整数に限定してしまい、仕様で認められている 12.5%の割引を拒否していたためです。これはモデルがコードを書けなかったというより、仕様にない制約を付け加えた例です。

T5 のリファクタリングでは両者とも全回成功し、所要時間は Claude Code の方が短くなりました。

### 最も難しかったのはT4

時間表記のパーサーを作成する T4 は、両アプリとも成功率 20% でした。

今回の仕様では `1h 2m 3s` だけでなく、間に空白のない `1h2m3s` も受理する必要があります。ところが、文字列を空白で分割する実装では、この条件を満たせません。

ほかにも、先頭ゼロを持つ `002h` を不必要に拒否した実装や、大きな整数に対する扱いの問題がありました。単純なテストを通しても、細かな入力仕様に対応できていないケースが見られました。

Claude Code の T4・１回目では、保存されたコードは非公開テストを通過していました。しかし、エージェントが正常終了せず 600 秒でタイムアウトしたため、一次評価では失敗としています。この試行では、32,768 トークンのコンテキスト上限を超えるリクエストが発生し、API 400 エラーも記録されています。

このように、生成したコードの正しさと、エージェントがタスクを正常に完了できるかは別だと分かりました。

### トークン消費量と LLM 呼び出し

トークン数・推論時間はサーバーから完全に取得できた試行だけの平均です。OpenCode は 25 件、Claude Code は 23 件であり、異なる母数の平均であることに注意してください。失敗しやすい長時間の試行が欠測に含まれるため、この数値だけで Claude Code のトークン効率が良いと断定できません。

| 1試行あたりの平均 | OpenCode | Claude Code |
| :-- | :-- | :-- |
| LLMへの要求回数 | 7.9回 | 7.4回 |
| ツール呼び出し回数 | 8.1回 | 6.9回 |
| 入力トークン数 | 61,300 | 46,642 |
| 出力トークン数 | 812 | 838 |
| Prompt Processing累積時間 | 107.1秒 | 83.6秒 |
| 生成累積時間 | 104.8秒 | 102.4秒 |

OpenCode は LLM への要求やツール実行がやや多い傾向でした。一方で、最終的な完了時間には大きな差がありません。エージェントの性能を比較する場合は、単純な token/s だけでなく、ツール実行や再試行を含めた総所要時間を見る必要があります。

## 同じモデルなのに結果が違う理由

今回使った GGUF モデルと推論サーバーは共通です。それでも結果が変わるのは、LLM へ渡す情報と、その回答を受け取った後の処理がアプリごとに違うためと考えられます。

| 違いが生じる部分 | 結果への影響 |
| :-- | :-- |
| システムプロンプト | 開発方針やツールの使い方など、LLM への事前指示が変わる |
| ツールの定義と結果 | ファイル検索・編集・コマンド実行で渡す情報が変わる |
| エージェントループ | 確認や再試行の回数が変わり、時間・成功率に影響する |
| コンテキスト管理 | 履歴の保持・要約・切り捨て方が変わる |
| API 形式と生成設定 | メッセージやツール定義の形式、生成条件が変わる |

ただし、今回のログだけでは、各要因が成功率や時間の差にそれぞれ何秒、何回分寄与したかまでは切り分けられません。モデルの乱数による出力の揺れも残ります。

今回は内部処理の優位性の検証ではなく、同じローカル LLM を使ったときの、エージェントを含む実用上の結果を比較したものです。

## まとめ

今回、ローカル LLM を利用するアプリを整理し、OpenCode と Claude Code を同じ Qwen3.8-27B、同じllama.cpp サーバーで比較しました。

結果は OpenCode が 21/25、Claude Code が 20/25 成功し、平均所要時間もほぼ同じでした。少なくとも今回の小規模な課題では、どちらか一方が圧倒的に優れている結果にはなりませんでした。

むしろ気になったのは、T4 のような細かい仕様への対応と、コンテキスト上限によるエラーです。LLM そのものの生成速度が速くても、仕様を見落としたり、エージェントが何度も確認を繰り返したりすれば、タスクの完了時間や成功率は変わります。

ローカルLLMを使うアプリを選ぶときには、推論の速さだけでなく、アプリがどのようにモデルを利用するのかも重要そうです。

## 参考

- [Unsloth](https://unsloth.ai/)
- [ローカル LLM 素人が作るローカル LLM 検証機](https://qiita.com/mitsuharu_e/items/92a3eccb65d9b5c4ceca)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
- [OpenCode](https://opencode.ai/)
- [Claude Code](https://code.claude.com/docs/)
- [LM Studio Bionic](https://lmstudio.ai/blog/introducing-lm-studio-bionic)
- [Strata](https://github.com/Niko1221/Strata)
- [新しい日本語推敲スキル「yomiyasu」がバズっていたので、Claudeで日本語推敲スキル3つを比べてみた](https://qiita.com/inoyu-qiita/items/0ffe6e74ecaf3aaa8b14)

<!-- textlint-enable -->
