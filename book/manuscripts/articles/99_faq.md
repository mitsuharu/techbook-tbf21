---
class: content
title: FAQ
author: 江本光晴
profile: |
  モバイルアプリ開発者。自作 PC とローカル LLM の検証を趣味にしています。
---

<div class="doc-header">
  <div class="doc-title">FAQ</div>
</div>

# FAQ

<aside class="publication-note">
  <div class="publication-note-label">Information</div>
  <div class="publication-note-text">本記事は書き下ろしです。</div>
</aside>

この章は、ローカル LLM に関して、おそらく多くの人が気になる質問などを答えていきます。また、執筆後に環境を使い続けると、短期間の検証では見えなかった問題が分かります。それらの中で、１記事にするほどではない内容を一問一答で補足します。

<!--
<section class="qa-item">
<div class="qa-question" markdown="1">
質問
</div>
<div class="qa-answer" markdown="1">
答え
</div>
</section>
-->

<section class="qa-item">
<div class="qa-question" markdown="1">
なんでローカル LLM を使ってるの？普通に ChatGPT や Claude Code でいいのでは？
</div>
<div class="qa-answer" markdown="1">
ローカル LLM は、脳と財布が焼かれたヤバい連中が、ロマンを求めてやっています。そして、すでに多くの人は ChatGPT や Claude Code にも課金しています。表向きな理由は本編記事を読んでください。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
グラボは何を買えばいい？
</div>
<div class="qa-answer" markdown="1">
お金に余裕があれば、Nvidia 系のクラボ。今だと RTX 5060 Ti 16GB あたりだけど、価格は上がってるので注意。安く済ませたい、簡単な推論だけで CUDA は不要なら、Radeon か Intel Arc も候補。ただし、ちょっとやり込むと、CUDA 前提なことも多く、面倒なことが起こるので注意。まあ、悩みごろは Codex たちが直してくれる場合もある。
</div>
</section>

<!-- <section class="qa-item">
<div class="qa-question" markdown="1">

ローカル LLM は、最初からマルチ GPU にするべきですか。

</div>
<div class="qa-answer" markdown="1">

いいえ。まずは GPU 1 枚で動く最小構成を作るのがお勧めです。必要なモデルが 1 枚の VRAM に収まらないと分かってから、増設を検討します。

</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">

Radeon GPU なら、どのアプリケーションでも ROCm を利用できますか。

</div>
<div class="qa-answer" markdown="1">

いいえ。アプリケーションが利用するバックエンドを個別に確認します。同じ Radeon GPU でも、ROCm、Vulkan、DirectML のどれを利用するかによって、導入方法と対応モデルが変わります。

確認するときは、次の順番で範囲を狭めます。

1. GPU ドライバーがデバイスを認識している
2. 計算ランタイムから GPU が見える
3. 推論エンジンが対象のバックエンドで起動する
4. 小さい既知モデルで推論できる

</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">

回答の中へコマンドや複数の段落を載せられますか。

</div>
<div class="qa-answer" markdown="1">

載せられます。たとえば、llama.cpp のサーバーをローカルホストだけで起動する例は次のとおりです。

```powershell
./llama-server.exe `
  --model ./models/example.gguf `
  --host 127.0.0.1 `
  --port 8080
```

コマンドの前後にも段落を置けます。LAN へ公開する場合は、待ち受けアドレスだけでなく、Windows ファイアウォールと認証の設定も確認します。

</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">

長い回答がページをまたいでも大丈夫ですか。

</div>
<div class="qa-answer" markdown="1">

回答が長い場合は、Q と回答の先頭を離しません。回答がページの残りへ収まらなければ、その後の本文を次のページへ送ります。カード全体を無理に 1 ページへ収めないため、大きな空白ができにくい構成です。

実際の原稿では、ひとつの回答が長くなりすぎたら、質問を分けることも検討します。一問一答の利点は、読者が疑問から答えへ直接移動できることです。異なる論点をひとつの回答へ詰め込むと、その利点が弱くなります。

回答内では通常の本文と同じように、次の要素を利用できます。

- 複数の段落
- 番号付きリストと箇条書き
- コードブロック
- インラインコード
- 脚注

ただし、非常に大きな表や画像はカードの外へ出します。直前の回答から参照すると読みやすくなります。

</div>
</section> -->
