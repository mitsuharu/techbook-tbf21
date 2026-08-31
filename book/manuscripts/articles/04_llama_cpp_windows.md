---
class: content
title: Windows + マルチ Radeon GPU 向けに llama.cpp をビルドする
author: 江本光晴
profile: |
  モバイルアプリ開発者。自作 PC とローカル LLM の検証を趣味にしています。
---

# Windows + マルチ Radeon GPU 向けに llama.cpp をビルドする

<aside class="publication-note">
  <div class="publication-note-label">転載記事</div>
  <p>これは 2026 年 8 月 25 日に mthr blog で掲載しました。本文を、表記を変えずに転載しています。埋め込み URL は印刷できるリンクカードに置き換えました。</p>
  <p class="publication-note-url">掲載元：https://mthr.hatenablog.com/entry/2026/08/25/190317</p>
</aside>

<!-- textlint-disable -->

<p>私のメインとなる LLM 検証機は、Windows で複数の Radeon GPU を搭載しています。その RAM と VRAM はカジュアル用途には十分な量があるので満足していますが、１つ問題がありました。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./04_llama_cpp_windows/qiita.com.png" alt="qiita.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">ローカル LLM 素人が作るローカル LLM 検証機 - Qiita</div>
    <div class="link-card-domain">qiita.com</div>
    <div class="link-card-url">https://qiita.com/mitsuharu_e/items/92a3eccb65d9b5c4ceca</div>
  </div>
</div>

<p>私は日常的に Ollama を採用して、LLM 推論を行なっています。個人的には、リッチな UI を持つ LM Studio なども併用したいところですが、この検証機では Ollama <strong>だけ</strong>を利用しています。なぜかというと、この検証機では必ずクラッシュするからです。LM Studio などは他の検証機でも利用していますが、複数の Radeon GPU がある環境では推論が失敗しました。</p>

<p><figure class="figure-image figure-image-fotolife" title="推論過程で文字化けして止まる"><span itemscope itemtype="http://schema.org/Photograph"><img src="./04_llama_cpp_windows/20260825132416.png" width="1153" height="722" loading="lazy" title="" class="hatena-fotolife" itemprop="image"></span><figcaption>推論過程で文字化けして止まる</figcaption></figure></p>

<p>この例は Ollama ではないです。他の推論アプリで、このように文字化けして、推論が正しく動きません。文字化けならまだマシな方で、モデルを VRAM にマウントする途中で PC がクラッシュすることもあります。マウントしたグラボが動作無効の扱いになり、デバイスマネージャーから再有効する日々でした。</p>

<p>ちなみに、RTX 5060 Ti 16GB を２つ積んだ別の検証機だと、LM Studio で問題なくマルチ GPU は動作しました。マルチ Radeon GPU が問題のようです。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./04_llama_cpp_windows/mthr.hatenablog.com.png" alt="mthr.hatenablog.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">グラボを OCuLink で追加してみた - mthr blog</div>
    <div class="link-card-domain">mthr.hatenablog.com</div>
    <div class="link-card-url">https://mthr.hatenablog.com/entry/2026/08/07/214317</div>
  </div>
</div>

<p>そんなわけで、私が検証した限りでは正常に動作した Ollama を利用しています。Ollama がある限り、LLM 推論に問題はありません。しかしながら、Ollama しか利用できないのは、不安です。ツール依存はいつ問題が起こるか分かりません。</p>

<p>そこで、いろいろ調査していました。そのとき、ビルドオプションや ROCm の設定周りが影響してるのではと、アドバイスをいただきました。それを起点に調査と実装したところ、問題は解決しました（主に行なったのは Codex ですが）。</p>

<p><blockquote data-conversation="none" class="twitter-tweet" data-lang="ja"><p lang="ja" dir="ltr">おそらく<br>Unsloth Studioのllama.cppはGGML CUDA NO PEER COPY=OFFでビルドされてる<br>Ollamaのllama.cppはこの設定をONでビルドしている<br>あとUnslothStudioの中のROCmなんだけど7.14らしいから<br>自身で入れているROCmがそれより古いとドライバーとRCCLの不整合でおかしな挙動するかも</p>&mdash; CopenDeCamp (@CopenDeCamp) <a href="https://x.com/CopenDeCamp/status/2090368867151618180?ref_src=twsrc%5Etfw">2026年8月20日</a></blockquote>  </p>

<p>そんなわけで、Windows  + マルチ Radeon GPU 向けの llama.cpp をビルドするリポジトリを公開しました。同環境で悩む人がいれば、これで対応できます（できるはずです）。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./04_llama_cpp_windows/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">GitHub - mitsuharu/llama.cpp-windows-gpu-builder: 主に Windows + マルチ Radeon GPU 環境向けに llama.cpp をビルドする</div>
    <div class="link-card-domain">github.com</div>
    <div class="link-card-url">https://github.com/mitsuharu/llama.cpp-windows-gpu-builder</div>
  </div>
</div>

<h2 id="ビルドの方針">ビルドの方針</h2>

<p>主な方針は次の２点です。</p>

<ol>
<li>GPU 間の peer copy を使わない</li>
<li>ROCm ランタイムを配布 ZIP に同梱する</li>
</ol>


<h3 id="GPU-間の-peer-copy-を使わない">GPU 間の peer copy を使わない</h3>

<p>本プロジェクトでは CUDA 版と ROCm 版の両方を、次の設定でビルドしています。名前には CUDA とありますが、現在の llama.cpp では ROCm バックエンドにも適用されます。</p>

<pre class="code text" data-lang="text" data-unlink>GGML_CUDA_NO_PEER_COPY=ON</pre>


<p>複数 GPU 間の直接コピーは高速です。一方で、私のように Windows で Radeon を複数組み合わせた環境や、PCIeの接続構成が異なる環境では、不安定要因になる可能性があります。</p>

<p>今回のビルドでは最高速度よりも、さまざまなマルチ GPU 構成での安定性を優先して peer copy を無効にしました。この設定は複数 GPU そのものを無効にするものではありません。異なる GPU 間で peer copy による直接転送を使わないという指定です。</p>

<p>Ollama は、Windows + ROCm 環境において、この機能を無効にしています。世間的に Ollama の推論は遅いと言われますが、これの安全に振った設定の副反応かもしれません、知らんけど。</p>

<pre class="code lang-make" data-lang="make" data-unlink>if(GGML_HIP AND OLLAMA_RUNNER_DIR MATCHES &quot;^rocm_v&quot;)
    ollama_set_cache_default(CMAKE_HIP_FLAGS STRING
<span class="synIdentifier">        &quot;-parallel-jobs</span>=4&quot; &quot;HIP compiler flags&quot;)
    if(WIN32)
        <span class="synComment"># Windows ROCm split-load needs peer copies disabled for correctness.</span>
        ollama_set_cache_default(GGML_CUDA_NO_PEER_COPY BOOL ON
</pre>


<div class="link-card">
  <img class="link-card-thumbnail" src="./04_llama_cpp_windows/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">ollama/llama/server/CMakeLists.txt at v0.32.15 · ollama/ollama</div>
    <div class="link-card-domain">github.com</div>
    <div class="link-card-url">https://github.com/ollama/ollama/blob/v0.32.15/llama/server/CMakeLists.txt#L99</div>
  </div>
</div>

<h3 id="ROCm-ランタイムを配布-ZIP-に同梱する">ROCm ランタイムを配布 ZIP に同梱する</h3>

<p>llama.cpp は、その GitHub リポジトリにて Windows + ROCm 向けのビルド済みファイルも配布しています。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./04_llama_cpp_windows/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">GitHub - ggml-org/llama.cpp: LLM inference in C/C++</div>
    <div class="link-card-domain">github.com</div>
    <div class="link-card-url">https://github.com/ggml-org/llama.cpp</div>
  </div>
</div>

<p>その ROCm 版には ROCm は同梱されておらず、各自のローカル環境に ROCm の導入が案内されています。ここで、ROCm 版をダウンロードしたが CPU 推論されたという記事を見ましたが、それは ROCm がその実行マシンに インストールされていない可能性がありますね。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./04_llama_cpp_windows/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">llama.cpp on Windows with AMD ROCm (HIP) — Installation Guide · ggml-org llama.cpp · Discussion #27047</div>
    <div class="link-card-domain">github.com</div>
    <div class="link-card-url">https://github.com/ggml-org/llama.cpp/discussions/27047</div>
  </div>
</div>

<p>この導入手順に従って ROCm を導入すると、Ollama など既存ツールがうまく動作しなくなりました。おそらく、導入過程で設定した環境変数などが、既存ツールの ROCm に干渉したのではと推測します。他に推論ツールを入れてなければ問題ないですが、いくつかのツールを利用するので、これはまずいです。</p>

<p>ここで Ollama は ROCm をインストールしてない環境でも、ROCm を利用しているのを思い出しました。そう ROCm を同梱してるのです。また、ROCm をインストールする方式では、ビルド時と実行時の ROCm のバージョンが異なる場合が多々あります。</p>

<p>そこで Ollama に近い考え方で、ROCm 版 ZIP に次のものをまとめました。</p>

<ul>
<li>llama.cpp の実行ファイル</li>
<li>ROCm/HIP の実行時 DLL</li>
<li>間接的に必要になる DLL</li>
<li>GPU ターゲット別カーネル</li>
<li>起動用 PowerShell スクリプト</li>
</ul>


<p>別途、グラフィックドライバーの AMD Software: Adrenalin Edition アプリケーションのインストールが必要です。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./04_llama_cpp_windows/www.amd.com.png" alt="www.amd.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">AMD Software: Adrenalin Edition™ アプリケーション</div>
    <div class="link-card-domain">www.amd.com</div>
    <div class="link-card-url">https://www.amd.com/ja/products/software/adrenalin.html</div>
  </div>
</div>

<p>この梱包アプローチにより、ROCm の個別インストールと（面倒くさい）環境変数の設定は不要になりました。導入が簡単になりました。</p>

<h2 id="対応バックエンド">対応バックエンド</h2>

<p>このリポジトリでは、Windows x64 向けに次のバックエンドに対応します。ただ、世間一般的に CUDA 前提で作られているので、ここでビルドする必要性はないです。Codex が作成してくれたので、残しています。</p>

<ul>
<li>NVIDIA CUDA</li>
<li>AMD ROCm</li>
<li>Vulkan</li>
</ul>


<p>ROCm 版は gfx1200 や gfx1201 など、GPU ターゲットを選んでビルドします。</p>

<h2 id="ビルド環境">ビルド環境</h2>

<p>このリポジトリは、原則的に GitHub Actions Runner の Windows 仮想環境を用いて、ビルドします。llama.cpp のアップデート頻度が多い、ROCm などの各種バージョンをダウンロードしてたら、ローカル環境が汚染されてしまうからです。あと、雑に利用する検証機なので、Windows 自体を壊す可能性もあり、再インストールもありえます。そのため、ビルド環境は別に用意したかった</p>

<p>GitHub Actions のワークフローから、バックエンドの種類と llama.cpp のバージョンを選択すると、ビルドされた Zip ファイルが生成されます。そのファイルは GitHub Release に添付してるので、誰でもご利用できます。</p>

<h2 id="実行例">実行例</h2>

<p>ビルドされた llama.cpp を実行して、Windows + マルチ Radeon GPU の環境で LLM 推論ができるのか確認しました。</p>

<h3 id="Unsloth-Desktop-で動作実行する">Unsloth Desktop で動作実行する</h3>

<p>今年8月、Unsloth からデスクトップ向けのアプリ Unsloth Desktop がリリースされました。</p>

<p><blockquote data-conversation="none" class="twitter-tweet" data-lang="ja"><p lang="en" dir="ltr">Introducing Unsloth Desktop 🦥<br>The first desktop app to run and train models locally.<br><br>• Open-source. Runs on Mac, Windows and Linux<br>• Supports MLX, diffusion image/video, audio, GGUF<br>• Connect Claude Code and Codex to local LLMs<br>• 50% more accurate, self-healing tool calls +… <a href="https://t.co/vjTFB1e5IQ">pic.twitter.com/vjTFB1e5IQ</a></p>&mdash; Unsloth AI (@UnslothAI) <a href="https://x.com/UnslothAI/status/2087177146662072546?ref_src=twsrc%5Etfw">2026年8月11日</a></blockquote>  </p>

<p>LM Studio は Bionic として、エージェント向けにシフトしたので、今は Unsloth Desktop を利用しています。LM Studio は従来アプリも更新されているので、Bionic と従来アプリの関係性がよく分からない。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./04_llama_cpp_windows/lmstudio.ai.png" alt="lmstudio.ai のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">LM Studio Bionic - Your Agent for Work and Code</div>
    <div class="link-card-domain">lmstudio.ai</div>
    <div class="link-card-url">https://lmstudio.ai/</div>
  </div>
</div>

<p>さておき、Unsloth Desktop の直近のリリース <a href="https://github.com/unslothai/unsloth/releases/tag/v0.1.801-beta">v0.1.801-beta</a> で、カスタム llama.cpp が指定できるようになりました。まさに私が抱えてる問題を解決するためのアップデートです。</p>

<p><figure class="figure-image figure-image-fotolife" title="Unsloth Desktop でカスタム llama.cpp を指定する"><span itemscope itemtype="http://schema.org/Photograph"><img src="./04_llama_cpp_windows/20260825132413.png" width="1165" height="759" loading="lazy" title="" class="hatena-fotolife" itemprop="image"></span><figcaption>Unsloth Desktop でカスタム llama.cpp を指定する</figcaption></figure></p>

<p>私がビルドした llama.cpp のディレクトリを指定して、LLM 推論を行いました。結果は無事に推論することができました。</p>

<p><figure class="figure-image figure-image-fotolife" title="マルチ Radeon GPU 環境で LLM 推論が成功する"><span itemscope itemtype="http://schema.org/Photograph"><img src="./04_llama_cpp_windows/20260825132420.png" width="1153" height="722" loading="lazy" title="" class="hatena-fotolife" itemprop="image"></span><figcaption>マルチ Radeon GPU 環境で LLM 推論が成功する</figcaption></figure></p>

<p>これで、マルチ Radeon GPU でも自由に LLM 推論ができます！まあ、ほぼほぼ現行 Ollama が提供しているランタイムの真似やクローンでもあるんですが、自身で管理できるというメリットが大きいです。</p>

<h2 id="注意点">注意点</h2>

<ul>
<li>ROCm ランタイムを同梱するため ZIP は大きくなります</li>
<li>AMDドライバーは別途必要です</li>
<li>Radeon GPU に対応する gfx ターゲットを選ぶ必要があります</li>
<li>peer copy 無効化は高速化ではなく、安定性を優先する設定です</li>
<li>すべての GPU 環境での動作を保証するものではありません</li>
</ul>


<h2 id="まとめ">まとめ</h2>

<p>私の Windows + マルチ Radeon GPU の環境では、Ollama で LLM 推論ができましたが、他の推論アプリではうまく動作しないケースが多々ありました。そこで、llama.cpp を GPU 間の peer copy を無効してビルドし、ROCm ランタイムを同梱する配布する方法を採用して、自身でビルドできる環境を構築しました。</p>

<p>その自身でビルドした llama.cpp のおかげで、不安定だった  Windows + マルチ Radeon GPU の環境での LLM 推論は安定しました。わいのマルチ Radeon GPU 構成のローカル LLM が、さらに本気を出して動くぞい。</p>

<p>詳しいビルド処理、対応ターゲット、GitHub Actions、実行方法はリポジトリにまとめているので、興味ある方は参照してください。</p>

<div class="link-card">
  <img class="link-card-thumbnail" src="./04_llama_cpp_windows/github.com.png" alt="github.com のサムネイル">
  <div class="link-card-body">
    <div class="link-card-title">GitHub - mitsuharu/llama.cpp-windows-gpu-builder: 主に Windows + マルチ Radeon GPU 環境向けに llama.cpp をビルドする</div>
    <div class="link-card-domain">github.com</div>
    <div class="link-card-url">https://github.com/mitsuharu/llama.cpp-windows-gpu-builder</div>
  </div>
</div>

<!-- textlint-enable -->
