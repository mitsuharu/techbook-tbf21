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
お金に余裕があれば、Nvidia 系のグラボ。今だと RTX 5060 Ti 16GB がよいですが、価格は上がってるので注意。安く済ませたい、簡単な推論だけで CUDA は不要なら、Radeon か Intel Arc も候補。ただし、ちょっとやり込むと、CUDA 前提なことも多く、面倒なことが起こるので注意。まあ、悩みごとは Codex たちが直してくれる。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
Mac でもローカル LLM は動かせる？
</div>
<div class="qa-answer" markdown="1">
動きます。たとえば LM Studio を入れれば、すぐにお試しできます。ただし、Mac は後からメモリを増やせないので、購入時にスペックを盛らないと厳しいです。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
最初に入れるアプリは何がいい？
</div>
<div class="qa-answer" markdown="1">
GUI で完結する LM Studio が初心者向けです。そのアプリだけで、モデルの検索とダウンロード、LLM 推論ができます。CLI に抵抗がなければ Ollama もよいです。私は最近 Unsloth Desktop をよく使っています。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
自分の PC でどのくらいのモデルが動くか、目安はある？
</div>
<div class="qa-answer" markdown="1">
ざっくり「モデルのファイルサイズ ＋ 数 GB」が VRAM に収まるかで考えます。たとえば gemma4 12b Q4 はモデルサイズが約 8 GB ぐらいで、KV キャッシュや実行時バッファなどがあるので VRAM 12 GB でギリギリかはみ出るぐらい。16 GB の VRAM なら余裕で乗ります。Ollama や LM Studio のモデル一覧にサイズが書いてあるので、まずはそれと手持ちの VRAM を見比べてください。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
VRAM に乗り切らないモデルは使えないの？
</div>
<div class="qa-answer" markdown="1">
使えます。乗り切らない分はシステムメモリと CPU で処理されます。ただし、めっちゃ遅くなります。RTX 5060 Ti 16 GB の検証では、全部乗る gemma4:12b が約 98 tok/s、3 割ほど溢れた qwen3.8:27b が約 16 tok/s でした。CPU が N100 だと 2.7 tok/s まで落ちて、文字が出てくるのを眺めるレベルです。結局、VRAM に全部乗せるのが一番の近道です。

ただ、最近はモデル選択の考えが変わる傾向もあって、Strata のように巨大なモデルを CPU やメモリなど他のリソースを使って動かす方法もありますね。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
何 tok/s くらい出れば実用的？
</div>
<div class="qa-answer" markdown="1">
個人の体感ですが、チャットなら 15 〜 20 tok/s あれば、人が読む速さとそんなに変わらないので普通に使えます。一方で、エージェントにコードを書かせる場合は、50 ~ 60 tok/s ぐらいあると安心します。速いに越したことはないです。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
システムメモリ（RAM）はどれくらい積めばいい？
</div>
<div class="qa-answer" markdown="1">
VRAM と同じくらい大事です。モデルは VRAM だけでなく RAM 側にも同程度載ります。OS などの利用もあるので、経験的に「VRAM の総容量 ＋ 10 GB 以上」あると安心です。足りないとスワップが起きて、PC ごと不安定になります。

DDR5 は高いので、私のメイン検証機は DDR4 で 128 GB 積みました。他のサブ検証機でも 64 GB を載せてます。中古やフリマで探しました。また、前に書いた Strata は 64 GB が推奨なので、財布が許す限り盛りましょう。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
CPU は弱くても大丈夫？
</div>
<div class="qa-answer" markdown="1">
モデルが VRAM に全部乗るなら、ほぼ大丈夫です。同じ RTX 5060 Ti で比べたら、N100 と Ryzen 7 7700 の差は約 1.2 倍でした。ただし、VRAM から溢れると CPU が計算するので、約 6 倍の差になりました。大きなモデルを使いたいなら、CPU とメモリにもちゃんと投資しましょう。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
最初からマルチ GPU にするべき？
</div>
<div class="qa-answer" markdown="1">
いいえ。まずは GPU 1 枚で動く構成を作るのがお勧めです。使いたいモデルが 1 枚に収まらないと分かってから、増設を考えれば十分です。

私が Radeon 2 枚を始めた時は、推論ソフトでうまくいかず、自前で llama.cpp をビルドするなど、対応してました。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
2 枚目のグラボを PCIe x4 や OCuLink で繋いでも遅くならない？
</div>
<div class="qa-answer" markdown="1">
推論速度にはほとんど影響しません。モデルを VRAM にマウントしてしまえば、生成中に PCIe を流れるデータはわずかだからです。差が出るのはモデルのロード時間くらいです。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
Radeon でも本当に大丈夫？
</div>
<div class="qa-answer" markdown="1">
LLM の推論だけなら、Ollama や LM Studio で普通に動きます。さらに最近リリースされた ROCm 10 で、llama.cpp の生成速度が約 10 倍になりました。ただし、ComfyUI での画像・動画生成やマルチ GPU など、ちょっと手を広げると CUDA 前提の壁にぶつかります。そこを AI に聞きながら乗り越えるのも、Radeon の楽しみ方です（たぶん）。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
同じモデルなのに、アプリによって速さが違うのはなぜ？
</div>
<div class="qa-answer" markdown="1">
Ollama も LM Studio も中身は llama.cpp ですが、同梱しているバージョンやビルドオプションが違うからです。さらに、fork して独自にカスタムしている場合もあります。また、エージェント系のアプリは、システムプロンプトやツールの使い方が違うので、同じモデルでも結果や時間が変わります。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
ローカル LLM でクラウドの AI サービスは不要になる？
</div>
<div class="qa-answer" markdown="1">
なりません。最近のオープンウェイトモデルは Claude Code などに匹敵するようになりましたが、それらは準備が大変です。DGX Spark を数台所有ではない限り、今はクラウドのトークン消費を抑える補助として使うのが現実的です。あとは、外部に送れない秘匿案件では、選択肢にあがります。私も Claude Code などいくつかのサービスに課金して利用してます。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
「クラウド型のローカル LLM」って矛盾してない？
</div>
<div class="qa-answer" markdown="1">
してます。私も混乱しています。オープンウェイトモデルの中には数百 GB 級のものもあり、個人の PC では扱えません。それを Ollama Cloud などのクラウドで動かすのがクラウド型です。ローカルで動かすメリットはなくなりますが、オープンウェイトモデルを自由に使える手段として、大きいモデルはこちらに任せています。
</div>
</section>

<section class="qa-item">
<div class="qa-question" markdown="1">
OS は Windows と Linux のどっちがいい？
</div>
<div class="qa-answer" markdown="1">
慣れているほうで大丈夫です。私はゲームもするので Windows を使っています。Radeon の ROCm を本格的に使うなら、Linux のほうが相性はよいですが、Windows でも問題ないです。また、常時起動のサーバーにするなら、Windows より負荷が小さい Linux がお勧めです。私も N100 機は途中で Ubuntu に入れ替えました。
</div>
</section>
