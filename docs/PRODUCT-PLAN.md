# Stoafi: ürün planı, arayüz eleştirisi ve yol haritası

1 Ekim 2026 · @Umut · yazan: Claude

Bu belge tek seferde yapılacak bir iş listesi değil. **Sayfa sayfa, her sayfa kendi onayıyla** gideceğiz. Burada her şeyin haritası var: dürüst teşhis, tasarım sistemi, her ekranın her butonu, yeni özellikler, modüllerin birbirine bağlanışı, müşteriye hazır olma listesi ve sıralı plan. Sonunda **senin onayını bekleyen kararlar** listelenmiş.

İçindekiler

1. Dürüst teşhis (sert öz eleştiri)
2. Hedef: nasıl bir ürün olmalı
3. Tasarım sistemi
4. Bilgi mimarisi ve gezinme
5. Sayfa sayfa plan (her buton, her alan)
6. Yeni özellikler: ek kart, banka widget'ları, AI'ya sor
7. Modüllerin birbirine bağlanması ve yeni bağlar
8. Önerilerim (onayını bekleyenler)
9. Müşteriye hazır olma listesi
10. Yol haritası (fazlar ve sıra)
11. Karar bekleyen sorular

---

## 1. Dürüst teşhis (sert öz eleştiri)

**Soru: arayüzü modern yapabildik mi? Cevap: hayır.** Temiz ve tutarlı yaptık, ama modern bir finans ürünü yapmadık. Kendime notum 10 üzerinden 5. Sebepleri:

### 1.1 Süreç hatası benim

- Önce işlevleri yazdım, arayüzü sonradan üstüne giydirdim. Önce akışı tasarlayıp (tel kafes, boş durumlar, mobil), sonra kodlamam gerekirdi.
- "Modern" ölçütüm "shadcn bileşenleriyle tutarlı görünüm" oldu. Bu yanlış ölçüt. Tutarlı bir şablon, iyi bir ürün değildir.
- Kendi tarayıcı kontrollerimi hep **dolu veriyle, masaüstünde** yaptım. Boş durumlara ve telefona bu turda ilk kez dikkatle baktım ve aşağıdaki sorunları orada gördüm.
- Testlerim işlevi doğruluyor ama **ekranın kötü görünmesini yakalamıyor**. Repoda tarayıcı testi (e2e) ve görsel kontrol yok; yaptığım kontroller geçici betiklerdi.

### 1.2 Ekranlarda gördüğüm somut sorunlar (hepsi doğrulandı)

**Gerçek hatalar (hemen düzeltilmeli):**

| # | Nerede | Sorun |
| --- | --- | --- |
| H1 | Kararlar | Vazgeçilen ürünün **adı yerine ham kimlik** (`0d2c0c09-2123-4e37-...`) görünüyor. Ürün silindiği için ad kayboluyor. Karar kaydı adı kendi içinde saklamalı |
| H2 | Kuyruk önizlemesi | Kural uyarıları geliştirici metniyle görünüyor: `emergency-fund-floor`, `wants-limit`. Çevrilmemiş, anlaşılmaz. Bu aynı zamanda "her metin i18n'den geçer" kuralını ihlal ediyor |
| H3 | Kartlar, asgari ödeme | "Months to payoff: 600" yazıyor. 600, hesabın güvenlik sınırı: gerçekte **"asla bitmez"** demek. Kullanıcıyı yanıltıyor |
| H4 | Profil | Ülke seçince enflasyon doluyor ama sayfa yeniden açılınca ülke alanı "Choose a country" gösteriyor. Hangi ülkeden geldiği kayboluyor |
| H5 | Sağlık | "Savings rate 0.0%" yazıyor ama kullanıcı ayda 20.000 TL artırıyor olabilir. Sebep: formül yalnızca "birikim/yatırım" kovasındaki **takip edilen** kayıtlara bakıyor, kullanıcı kendi yaptığı transferi girmiyor. Yanlış ve moral bozucu bir sayı |
| H6 | Sağlık | "Runway 3.5" birimsiz (ay mı, hafta mı?). "Emergency fund months 3.5" de açıklamasız, iyi mi kötü mü belli değil |
| H7 | Ayarlar | Dil seçicisi ham kod gösteriyor (`en`, `tr`). Örnek tutar `TRY 123,456.78` yazıyor, diğer her yerde `₺` kullanıyoruz. İçe aktarma, tarayıcının ham dosya seçicisi ("Choose File / No file chosen") |
| H8 | Kuyruk, zaman çizelgesi | Aynı öğeler listede ve altında "12-month timeline" kartında tekrar ediyor. Aynı bilgi iki kez, ikisi de zayıf |
| H9 | Tüm sayfalar | **Kaydet'e basınca hiçbir geri bildirim yok.** Profil kaydedildi mi, belli değil. Silme düğmeleri onay ve geri alma olmadan siliyor |
| H10 | Telefon | Üst menü yatay kayıyor ve 11 öğenin yalnızca 3'ü görünüyor; kaydırılabildiği belli değil. Ana sayfa grafiği sağdan taşıyor. Etiketler birbirine biniyor |

**Tasarım zayıflıkları:**

| # | Zayıflık | Neden önemli |
| --- | --- | --- |
| T1 | **Her sayfa, beyaz kartlardan oluşan bir yığın.** Hiyerarşi yok, hangi sayı önemli belli değil. "Hepsinden sonra kalan ₺21.700" ana sayfanın kahramanı olmalı, şu an etiketle aynı boyda | Kullanıcı ilk 3 saniyede "durumum iyi mi?" sorusunu cevaplayamıyor |
| T2 | **Bağlamsız sayılar.** Plan "Needs ₺22.500" diyor ama bunun ne kadarını harcadığım yok. Projeksiyon her kova için `limit` ve `committed` biliyor, **ilerleme çubuğu bile çizmiyoruz**. Ürünün temel kavramı ekranda görünmüyor | Bütçe uygulamasının ilk beklentisi "ne kadar kaldı" |
| T3 | **Marka ve kimlik yok.** Siyah-beyaz-gri şablon rengi, sistem yazı tipi, ikon dışında görsel yok. Hiçbir ekran "bu Stoafi" demiyor. Karanlık tema yoktu, ben de arayüz taşımasında kaybettim | Güven ve akılda kalıcılık: para uygulaması birine emanet edilir |
| T4 | **Boş durumlar tek cümle.** Kararlar, Sağlık, Profil, Kartlar boş ve ölü. Yeni kullanıcı ne yapacağını bilmiyor. Karşılama ve kurulum rehberi yok | İlk 5 dakika ürünü yaşatır ya da öldürür |
| T5 | **Formlar sayfanın tepesinde.** Kuyrukta öğe ekleme formu sayfanın yarısı; liste aşağı itiliyor. Asıl içerik (liste) ikinci sırada | Ekleme nadir bir eylem, listeye bakmak sık |
| T6 | **Önizleme sayfanın en altında.** Kuyruktan bir ürün seçince etkisi ekranın dibinde açılıyor, kullanıcı kaydırmazsa görmüyor | Ürünün kalbi olan "önce → sonra" etkisi gizli |
| T7 | **Sayılar tek tip.** Pozitif/negatif renk, büyük rakam, ilerleme halkası, eğilim oku yok. Ders kartları uzun metin duvarı | Finans zor; görsel dil işi kolaylaştırmalı |
| T8 | **"Okul" vaadi karşılanmıyor.** Dersler ayrı bir sayfada metin yığını. Karar anında, ilgili sayının yanında çıkmıyor | Ürünün farkı "dünyanın iyi finans yazarlarının bilgisi" |
| T9 | **Erişilebilirlik ölçülmedi.** Yukarı/aşağı okları 24 px (dokunma hedefi en az 44 px olmalı), durum renkle verilmiş, 12 px etiketler var | Müşteri ürünü için asgari kalite |
| T10 | **Yazı tipi ve hareket.** Sayfa geçişi, yükleniyor iskeleti, mikro geri bildirim yok. Tarayıcı varsayılan yazı tipi | Hissedilen kalite |

### 1.3 Güçlü yanlar (korunacak)

- Hesap çekirdeği sağlam: saf fonksiyonlar, %100 satır / %98 dal kapsama, tek deftere (ledger) bağlı hesap.
- Yerel-önce ve ağsız: gizlilik hikayesi güçlü, bunu satış noktası yapabiliriz.
- TR/EN, para birimi ve para girişi (TL cinsinden yazılır, kuruş olarak saklanır) doğru kurulu.
- Ders kartları içerik olarak iyi; sadece sunumları zayıf.

---

## 2. Hedef: nasıl bir ürün olmalı

> Finans karmaşık. Stoafi, karmaşıklığı kullanıcının üstünden alan, ama **neden** öyle olduğunu öğreten sakin bir danışman olmalı.

İlkeler (SPEC'in 6 ilkesine ek olarak arayüz için):

1. **3 saniye kuralı.** Her sayfa ilk bakışta tek soruyu cevaplar ("durumum nasıl?", "bu ay neye sığar?", "bu alım mantıklı mı?").
2. **Önce sonuç, sonra ayrıntı.** Büyük bir sonuç sayısı, altında nedeni, altında düzenleme. Gelişmiş ayarlar açılır bölümlerde.
3. **Her sayı bağlamlı.** Tek başına sayı yok: yanında hedef/sınır, ilerleme, renk ve gerekirse ⓘ (ders kartı).
4. **Her eylemin geri bildirimi var.** Kaydedildi bildirimi, silince geri al, yıkıcı eylemde onay.
5. **Boş durum bir öğretmendir.** Boş sayfa ne olduğunu, neden önemli olduğunu ve tek bir "ilk adım" düğmesini söyler.
6. **Önce telefon.** Çoğu kullanıcı telefonda açacak. Masaüstü, telefonun genişlemiş hali.
7. **Sakin ton.** Panik yaratan kırmızı yağmuru yok. Uyarı, çözüm önerisiyle birlikte gelir. Stoacı marka: telaşsız, net.

**İlham aldığım yerler** (taklit değil, öğrenilecek şeyler):

| Ürün | Ne öğrenilecek |
| --- | --- |
| YNAB | Kova ilerleme çubukları, "bu para ne için ayrıldı" mantığı, hedef çubukları |
| Monarch Money, Copilot Money | Sakin sayısal hiyerarşi, kahraman rakam + eğilim, temiz grafikler |
| Revolut, Monzo | Kart görselleri, "kumbara/pot" hedef kartları, harcama içgörüleri |
| Apple Wallet | Kartların üst üste dizilişi (ek kart için birebir model) |
| Stripe paneli | Net tablolar, yoğun ama okunur bilgi, durum rozetleri |
| Linear | Komut paleti (⌘K), klavye kısayolları, hızlı his |
| Notion | Boş durum şablonları, "ilk adım" rehberi |
| Duolingo | Küçük, bağlamlı öğrenme parçaları (oyunlaştırmayı abartmadan) |
| Wise | Karmaşık hesabı sade anlatma |

---

## 3. Tasarım sistemi

Şu an: shadcn varsayılanı (siyah/gri), açık tema. Hedef: **kendi kimliği olan, açık + koyu temalı bir sistem**.

### 3.1 Renk

- **Marka:** derin yeşil-turkuaz (sakin, para/büyüme çağrışımı) birincil; sıcak kehribar vurgu (uyarı/dikkat). Yeşil/kırmızıyı tek başına "iyi/kötü" yapmayacağız (renk körlüğü): her duruma ikon + metin eklenir.
- **Anlamsal renkler:** `positive`, `negative`, `warning`, `info`, `neutral` ve her birinin yumuşak arka plan hali.
- **Veri renkleri (grafikler):** kova başına sabit renk: İhtiyaç, İstek, Birikim, Yatırım, Taksit, Hedef. Her yerde (kart, grafik, rozet) aynı renk. Erişilebilir kontrast için doğrulanmış palet kullanılacak (`dataviz` becerisiyle).
- **Koyu tema** ilk günden; kullanıcı Sistem / Açık / Koyu seçer.
- Banka renkleri (kart widget'ı) tema renginden ayrı, veri dosyasından gelir (bkz. 6.2).

### 3.2 Tipografi

- **Sayılar:** tabular (sabit genişlik) rakamlar, büyük puntolu "kahraman" rakamlar, para sembolü küçük ve soluk.
- **Başlıklar ve ders kartları:** okuma konforu için serif bir yüz (okul/editoryal his), arayüz için sans-serif.
- Yazı tipleri **cihaza gömülü (self-host)** olmalı: "çalışma anında uzak yazı tipi yok" kuralımız var. → **Onay gerek:** yeni bağımlılık (örn. `@fontsource-variable/*`) ya da sistem yazı tipi yığını. (Bkz. 11. soru 3.)

### 3.3 Düzen

- 4 px ızgara, 12–16 px köşe yarıçapı, yumuşak gölge (yalnızca yükseltilen yüzeylerde).
- Sayfa genişliği: içerik 1120 px'e kadar, masaüstünde 12 sütunlu ızgara; kartlar sütunlara oturur (şu anki "her şey tek sütun" sorunu çözülür).
- Telefon: tek sütun, 16 px kenar boşluğu, alt gezinme çubuğu.

### 3.4 Ortak bileşenler (kütüphane)

Şu an olanlar: Button, Card, Input, Label, Select, Table, Badge, NativeSelect, Field, Page, MoneyInput, PercentInput, DayOfMonthSelect.

Eklenecekler (hepsi bir kez yazılıp her sayfada kullanılır):

| Bileşen | Kullanıldığı yerler |
| --- | --- |
| `Money` (büyük/orta/küçük, işaretli, renkli) | her yer |
| `StatCard` (etiket, değer, birim, durum, eğilim, ⓘ) | Ana sayfa, Sağlık, Profil |
| `ProgressBar` / `ProgressRing` | kova kullanımı, acil durum fonu, birikim hedefleri, kart limiti |
| `Sheet` (yandan/alttan açılan panel) | kuyruk önizlemesi, öğe ekleme, ders okuma, ek kart ekleme |
| `Dialog` + `ConfirmDialog` | silme, tüm veriyi sil, içe aktarma onayı |
| `Toast` + geri al | kaydedildi, silindi (geri al), kopyalandı |
| `Tabs` / `SegmentedControl` | Plan stratejileri, Kuyruk görünümleri, Kararlar filtresi |
| `EmptyState` (ikon, başlık, açıklama, birincil eylem, ders bağlantısı) | tüm listeler |
| `Skeleton` | ilk yükleme |
| `InfoPopover` (ⓘ, kısa açıklama + "dersi oku") | tüm metrikler |
| `StatusChip` (iyi/dikkat/risk + ikon + metin) | Sağlık, Kuyruk, Kartlar |
| `CommandPalette` (⌘K) | hızlı git/ekle (öneri, bkz. 8) |
| `BankCard` (kart widget'ı) | Kartlar, kuyruk ödeme seçimi |
| `MonthTrack` (12 aylık şerit) | Kuyruk zaman çizelgesi, birikim hedefleri |

Yeni bağımlılıklar (shadcn/ui'nin standart yapı taşları): `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `sonner` (toast), `cmdk` (komut paleti). **Onay gerek** (CLAUDE.md: listede olmayan bağımlılık eklemeden önce sor).

### 3.5 Etkileşim kalıpları (her sayfada aynı)

- **Ekleme:** sayfanın üstünde "+ Ekle" düğmesi → yan panel (Sheet). Form sayfayı itmez.
- **Düzenleme:** satıra tıkla → aynı panel dolu açılır.
- **Silme:** onay yok ama **geri al** (5 sn toast). Yıkıcı toplu eylemde (tüm veri) onay penceresi.
- **Kaydetme:** küçük formlarda otomatik kaydet + "Kaydedildi" ipucu; uzun formlarda "Kaydet" + kaydedilmemiş değişiklik uyarısı.
- **Yükleniyor:** iskelet, boş sayfa değil.
- **Hata:** satır içi, çözüm önerisiyle.
- **Klavye:** tüm eylemler klavye ile; ⌘K; Esc panel kapatır.

### 3.6 Hazır bileşenler ve "göz alıcı" tasarım (21st.dev ve benzerleri)

**İstek:** modern, göz alan, kullanası gelen bir tasarım; hazır bileşen kütüphanelerinden (21st.dev gibi) yararlanılabilir. Evet, yapacağız. Önce dürüst durum:

- **Ben bu sandbox'tan 21st.dev ve Magic UI gibi sitelere erişemiyorum** (ağ engelli). Orada neyin göründüğünü göremem, bileşenleri doğrudan çekemem ve görünüşünü önceden doğrulayamam.
- Arama sonuçlarından öğrendiğim: 21st.dev, **shadcn/ui tabanlı topluluk bileşenlerinin kayıt defteri**; kod depoya **kopyalanıyor** (paket olarak içe aktarılmıyor). Ücretsiz katmanda günlük kopya sınırı var (arama sonucuna göre günde 2; değişebilir). **Lisans:** bir kaynak "her dosya MIT" diyor, başka bir kaynak "her bileşen katkıda bulunanın seçtiği lisansı taşır" diyor. Çelişkili, o yüzden **her bileşenin lisansını tek tek kontrol edeceğiz**.
- Diğer benzer kaynaklar (Magic UI, Aceternity UI, shadcn/ui blocks, Origin UI): bildiğim kadarıyla hepsi "kopyala-yapıştır" mantığında ve çoğu `motion` (framer-motion'ın yeni adı) kullanıyor; **bunlar benim bilgim, doğrulamadım**.

**Nasıl çalışacağız (iki yol, ikisini karıştırabiliriz):**

1. **Sen seç, ben uyarlayayım.** 21st.dev'de beğendiğin bileşenin **bağlantısını ya da kodunu** bana yapıştır. Ben depoya şunlarla alırım: tasarım jetonlarımıza bağlama (renkler, koyu tema), metinleri i18n'e taşıma (TR/EN), erişilebilirlik (klavye, ekran okuyucu, hareket azaltma), testler, dosya başına **lisans ve kaynak yorumu** ve `docs/THIRD-PARTY.md` kaydı.
2. **Ben yazayım.** Aynı hissi veren bileşenleri shadcn parçaları + `motion` ile **kendi kodumuzla** yazarım: lisans belirsizliği olmaz, tema/i18n baştan uyumlu olur. Dezavantaj: senin gözünle seçilmiş hazır görünümü birebir tutturamayabilirim.

**21st.dev'de arayacağın şeyler** (arama kelimeleri, beğendiklerini bana at):

| İhtiyaç | Arama | Nerede kullanılır |
| --- | --- | --- |
| Kredi kartı görseli / kart yığını | `credit card`, `card stack`, `wallet cards` | Kartlar, kuyruk ödeme seçimi |
| Sayaç animasyonu | `number ticker`, `count up`, `animated counter` | Ana sayfa kahraman sayı, kumbara |
| Dolan kumbara / ilerleme halkası | `progress ring`, `circular progress`, `piggy bank`, `coin` | Kumbaralar, acil durum fonu |
| Sidebar | `sidebar`, `app sidebar` | Uygulama kabuğu |
| Alt sekme çubuğu (mobil) | `bottom navigation`, `tab bar` | Telefon gezinme |
| İstatistik kartı | `stat card`, `metric card`, `kpi` | Sağlık, Ana sayfa |
| Boş durum | `empty state` | tüm listeler |
| Adım adım sihirbaz | `stepper`, `onboarding`, `wizard` | Onboarding |
| Zaman çizelgesi / takvim şeridi | `timeline`, `calendar strip`, `date picker` | Takvim, kuyruk zaman görünümü |
| Komut paleti | `command menu`, `command palette` | ⌘K |
| Animasyonlu sekmeler / segment | `animated tabs`, `segmented control` | Plan, Kuyruk görünümleri |
| Kısa grafik (sparkline) | `sparkline`, `mini chart` | Sağlık eğilimleri |
| Toast | `toast`, `sonner` | geri bildirim |
| Konfeti | `confetti` | hedef tamamlandı |

**Yeni bağımlılıklar (onay istiyorum):** `motion` (animasyon), isteğe bağlı küçük bir konfeti paketi (veya kendi canvas kodumuz), 3.4'te sayılanlar. Bunların hepsi bundle'a yük bindirir; ölçeriz (performans bütçesi, Faz 14).

---

## 4. Bilgi mimarisi ve gezinme

Şu an 12 öğeli düz liste. Mantıksal gruplara ayıracağız:

```
GENEL BAKIŞ     Ana sayfa
PARA            Gelir ve Giderler · Birikim hedefleri · Kartlar
PLAN            Plan · Kuyruk · Kararlar
DURUM           Sağlık
ÖĞREN           Dersler
                Profil ve Ayarlar (alt kısımda; ayar + AI'ya sor + veri)
```

- **Masaüstü:** sol kenar çubuğu, gruplu başlıklar, daraltılabilir.
- **Telefon:** alt sekme çubuğu **5 öğe**: Ana sayfa · Para · Plan · Sağlık · Daha fazla. "Daha fazla" bir sayfa (Kararlar, Dersler, Ayarlar...). Üst yatay kaydırmalı menü kalkar.
- **Sayfa başlığı çubuğu:** başlık + (varsa) birincil eylem ("+ Öğe ekle") + ay/bağlam bilgisi.
- **Hızlı eylem:** her yerde ⌘K / telefonda "+" düğmesi: "Kuyruğa ekle", "Gider ekle", "Kart ekle".
- **İlk kurulum:** profil yoksa kenar çubuğu kısıtlı, "Kurulumu tamamla" çağrısı (bkz. Onboarding).
- **Bağlantı dürüstlüğü:** her "Dersi oku" bağlantısı sayfadan çıkarmaz; panel açar (bkz. Plan).

---

## 5. Sayfa sayfa plan

Her sayfa için: amaç → mevcut durum (ekran görüntüsüne dayalı) → hedef yerleşim → **her buton ve alan** → boş/yükleniyor/hata → telefon → bağlantılar → kabul ölçütleri.

> Notasyon: ✅ olduğu gibi kalır, 🔧 değişir, 🆕 yeni, ❌ kalkar.

### 5.0 Onboarding (🆕, yeni kullanıcı ilk açışı)

**Amaç:** ilk 5 dakikada kullanıcıya "senin planın bu" dedirtmek (SPEC: profil 5 dakikada dolsun).
**Şimdi:** yok. Boş ana sayfada tek cümle ve tek buton.

Akış (tam sayfa sihirbaz, atlanabilir, ilerleme noktaları):

1. **Hoş geldin:** tek cümle + "Başlayalım" + **"Örnek verilerle gez"** (demo modu, SPEC geri listesi).
2. **Dil ve para birimi:** tarayıcıdan otomatik seçili; değiştirilebilir.
3. **Gelirin:** maaş adı + tutar + yatış günü. "Başka maaş ekle".
4. **Sabit giderlerin:** hızlı ekle çipleri: Kira, Faturalar, Kredi, Abonelik, Okul... tıkla → tutar sor. "Yaşam giderin (mutfak vb.) ayda yaklaşık ne kadar?" tek alan.
5. **Birikimin ve hedefin:** şimdiki birikim, acil durum hedefi (kaç ay önerilir + ⓘ).
6. **Sonuç ekranı:** "Bu ay ₺X kalıyor", seçili plan, "İlk alışveriş listeni oluştur" ve "Sağlık durumuna bak" düğmeleri.

Düğmeler: `Başlayalım`, `Örnek verilerle gez`, `Geri`, `İleri`, `Atla`, `Bitir`.
Boş durum/hata: her adımda zorunlu minimum (gelir) dışında atlanabilir; hata satır içi.
Telefon: her adım tek ekran, klavyeyi açınca düğme görünür kalır.
Kabul: yeni kullanıcı, kılavuzu bitirince ana sayfada dolu bir durum görür; demo modu tek tıkla kurulur ve tek tıkla silinir.

### 5.1 Ana sayfa

**Amaç:** "Bu ay durumum nasıl, sırada ne var?" tek bakışta.
**Şimdi (ekran görüntüsü):** başlık, kırmızı uyarı satırı, 4 beyaz kart (liste halinde sayılar), altta grafik. "Kalan" sayısı diğerleriyle aynı boyda. Kova kullanımı hiç yok. Telefonda grafik taşıyor. Boşken tek cümle.

**Hedef yerleşim (masaüstü):**

1. **Üst şerit:** selamlama + ay seçici (`< Ekim 2026 >`, ileri aylara bakmak için).
2. **Kahraman kart:** büyük "**Bu ay harcayabileceğin: ₺21.700**", altında `₺45.000 gelir − ₺14.300 düzenli − ₺9.000 yaşam − ₺0 taksit − ₺0 hedef`, yanında "ayın %X'indesin" ilerleme halkası.
3. **Kova kullanımı:** İhtiyaç / İstek / Birikim ilerleme çubukları (kullanılan / sınır), taşınca uyarı rengi + ne yapılacağı.
4. **Yaklaşan ödemeler (14 gün):** maaş günü (+), fatura/kredi vadeleri, kart son ödeme günleri; her satırda tutar ve gün (🆕, Gelir/Gider günleri ve kart gün alanları zaten var, şimdi hiçbir yerde görünmüyor).
5. **Sıradaki alım:** kuyruğun ilk öğesi, hangi ay sığıyor, "İncele" düğmesi (önizleme panelini açar).
6. **Acil durum fonu:** halka (3,5 / 6 ay), "hedefe ulaşma ayı", ⓘ.
7. **Plan özeti:** aktif plan adı + mini dağılım şeridi, "Planı değiştir".
7b. **Birikim kumbaraları** 🆕: "Bu ay ayırman gereken ₺Y, ayırdığın ₺A" çubuğu ve en yakın vadeli kumbaranın dolan görseli, hızlı `+ Para ekle` (5.6).
8. **12 aylık nakit akışı grafiği:** mevcut grafik, ama tek renk dili, telefonda yatay kaydırma yerine sığan hali, dokunmatik ipucu.
9. **Uyarılar:** her uyarı bir düğmeyle birlikte ("Acil durum fonun hedefin altında → Hedefi düzenle").

**Düğmeler/bağlantılar:** `Önceki ay`, `Sonraki ay`, `İncele` (sıradaki alım), `Planı değiştir`, `Kuyruğu aç`, `Hedefi düzenle`, her kart başlığı ilgili sayfaya gider, ⓘ'ler ders paneli açar.
**Boş durum:** onboarding'e yönlendirme (ya da demo).
**Telefon:** kahraman kart üstte, kartlar tek sütun, grafik tam genişlik ve dokununca ipucu.
**Bağlantılar:** Profil (gelir/gider/gün), Ledger (taksit/hedef), Kuyruk (sıradaki alım), Kartlar (vade), Plan (kovalar), Dersler (ⓘ).
**Kabul:** ilk 3 saniyede "kalan para" ve "uyarı var mı" okunur; telefonda yatay kayma yok.

### 5.2 Gelir ve Giderler

**Amaç:** düzenli akışı hızla girmek ve görmek.
**Şimdi:** maaş ve gider satırları form olarak, her satırda 5–6 küçük alan yan yana; "Save profile" düğmesi; altta taksit listesi. Satırlar sıkışık, telefonda uzun kaydırma. Birikim/yatırım türü seçilemiyor (H5'in kök nedeni).

**Hedef:**

- Üstte **özet şeridi:** toplam gelir, toplam düzenli gider, yaşam gideri, kalan, "gelirin %X'i sabit giderde" (⌛ ⓘ: 50/30/20 dersi).
- İki bölüm sekmesi/kartı: **Gelirler** · **Giderler**.
- Her gider **kart satırı:** ad, tutar, tür çipi (İhtiyaç / İstek / **Birikim / Yatırım** 🆕), vade günü, bitiş ayı rozeti ("Mart 2027'de biter"), abonelik rozeti, hızlı düzenle/sil.
- "+ Gider ekle" yan panelde; **hızlı ekle çipleri** (Kira, Fatura, Kredi, Abonelik).
- Taksit alımları ayrı bölüm: salt okunur kartlar (hangi alımdan, kalan taksit, ilerleme).
- Yaşam gideri: tek alan, ⓘ açıklaması ("market ve gündelik harcamalar tek toplam").

**Alanlar/düğmeler (şu anki envanter → hedef):**

| Şimdi | Hedef |
| --- | --- |
| `Salary N name`, `amount`, `pay day` | aynı alanlar, panelde; yatış günü takvim çubuğunda görünür |
| `Add salary`, `Remove salary N` | `+ Maaş ekle` (panel), sil = geri al toast |
| `Expense N name/amount/type/due day/has end month/end month` | satır kartı + düzenleme paneli; tür seçeneklerine **Birikim, Yatırım** eklenir; bitiş ayı "Süresiz / Şu ayda biter" segmenti |
| `Add expense`, `Remove expense N` | `+ Gider ekle`, sil = geri al |
| `Monthly living costs` | özet şeridinde düzenlenebilir alan |
| `Save profile` | ❌ kalkar: otomatik kaydet + "Kaydedildi" |
| taksit listesi: `Remove X` | `Taksiti kaldır` (onay penceresi: "alımı kuyruğa geri koy / tamamen sil") |

**Boş durum:** "Gelirini ekle" + "Örnek verilerle gez".
**Bağlantılar:** Ana sayfa, Plan (kova limitleri), Sağlık (birikim oranı H5 çözümü), Takvim (vade günleri).
**Kabul:** "Birikim" türünde bir gider, Sağlık'ta birikim oranına yansır; kaydet düğmesine gerek kalmaz.

### 5.3 Profil

**Amaç:** "bu uygulama beni nasıl tanıyor ve hangi varsayımlarla hesaplıyor?" Kullanıcı bu sayfayı **hesap makinesinin ayarı** değil, **kendi finansal kimliği** olarak görmeli.
**Şimdi:** dört alanlı, çok sade bir form ve "Save profile". Ülke seçimi kaydedilmiyor (H4). Çok boş.

**Hedef:**

1. **Üst özet kartı:** "Net geliriniz ₺45.000/ay · saatlik değeriniz ₺281 · sabit gider oranı %31". Saatlik değer, kuyruktaki "çalışma saati maliyeti"nin kaynağı; ⓘ ders (Vicki Robin) 🆕.
2. **Acil durum fonu kartı:** ilerleme halkası, birikim, hedef ay sayısı (`− 6 +`), "hedefe ulaşma ayı", ⓘ.
3. **Varsayımlar** (her biri açıklamalı, düzenlenebilir):
   - Mevcut birikim.
   - Ülke ve **yıllık enflasyon beklentisi** (ülke seçilince öneri, kaynağı ve tarihi altında, "kendi değerimi gireceğim" seçeneği; ülke artık saklanır).
   - Aylık çalışma saati (varsayılan 160): saatlik değeri etkiler.
4. **Hedefler** (kısa yol): "Birikim hedefi ekle" → Birikim hedefleri sayfası.
5. **Finansal anlık görüntü:** üç cümle, "Şu an X ay yetecek paran var, planın Y".

**Düğmeler:** `Birikimi güncelle`, `−`/`+` (hedef ay), `Ülke seç`, `Enflasyonu kendim gireyim`, `Birikim hedefi ekle`; kaydet düğmesi yok (otomatik).
**Boş durum:** gelir yoksa onboarding'e yönlendirir.
**Bağlantılar:** Kuyruk (saatlik değer), Plan (enflasyon → taksit NPV), Sağlık (acil durum), Dersler.
**Kabul:** sayfa dolu ve anlamlı; ülke yeniden açılınca görünür; her varsayımın yanında "neden" açıklaması var.

### 5.4 Plan

**Amaç:** "paramı nasıl böleceğim?" strateji seçmek ve neden o strateji olduğunu öğrenmek.
**Şimdi (ekran görüntüsü):** "Planın ne diyor" kartı, 4 çubuklu grafik, 4 strateji kartı (sayılar + uzun ders paragrafı), altta düz metin bağlantı ("Index funds and costs": kullanıcının dediği gibi ölü gibi duruyor; hâlâ başka sayfaya atıyor).

**Hedef:**

1. **Üstte aktif plan:** adı, **bu ay kova kullanımı** ilerleme çubukları (kullanılan/limit) 🆕, "Planın ne diyor" uyarıları eylem düğmesiyle.
2. **Stratejileri karşılaştır:** `SegmentedControl` (50/30/20 · Önce kendine öde · Bilinçli harcama · Bebek adımları). Seçilince altında **dağılım şeridi** + dört kova sayısı + "bu strateji kime uyar" + "neye dikkat" (ders kartından `fitsWhen`/`critique`), **"Bu planı kullan"** düğmesi.
3. **Grafik** sekmesi ("tüm stratejiler yan yana"), mevcut grafik korunur ama renkler tasarım sisteminden.
4. **Dersler panelde:** "Dersin tamamını oku" yan panel açar (sayfadan çıkarmaz), kaynak ve yazar başlıkta.
5. **Yatırım kovası bağlamı** 🆕: Yatırım satırında ⓘ; kova sıfırdan büyükse altında "Bu para nereye gidebilir?" eğitim kartları (Endeks fonları ve maliyetler: Bogle/Buffett). **Ürün tavsiyesi vermez**, yalnızca eğitim ve kavram.

**Düğmeler:** `Bu planı kullan`, `Aktif plan` (pasif), strateji sekmeleri, `Dersin tamamını oku`, ⓘ (her kova), `Yatırım hakkında öğren`.
**Boş durum:** gelir yoksa "Plan, gelirinle başlar" + onboarding bağlantısı.
**Telefon:** sekmeler yatay kaydırılır, grafik tek sütunda, kovalar yığılmış çubuk.
**Bağlantılar:** Gelir-Gider (limitlerin kaynağı), Kuyruk (zamanlayıcı bu limitlere bakar), Sağlık, Dersler.
**Kabul:** "Index funds and costs" artık bir panel açar; her stratejinin nasıl çalıştığı ve kime uyduğu sayfa terk edilmeden okunur.

### 5.5 Kuyruk (+ önizleme)

**Amaç:** istekleri ve ihtiyaçları sıralamak, ne zaman alınabileceğini görmek, **bilinçli** karar vermek.
**Şimdi (ekran görüntüsü):** sayfanın yarısı ekleme formu; altında liste; altında yinelenen 12 aylık zaman çizelgesi; en altta önizleme kartı. Rozetler (urgent/important) ham; "Headphones 8.9h" gibi çalışma saati anlamsız duruyor.

**Hedef yerleşim:**

1. **Başlık çubuğu:** `+ Öğe ekle` (yan panel), görünüm seçici `Liste · Eisenhower · Zaman`, filtre `Hepsi / İhtiyaç / İstek`.
2. **Özet şeridi:** "Kuyrukta toplam ₺X · bu ay sığan ₺Y · en yakın alım: Kasım".
3. **Liste (varsayılan görünüm, kartlar):** sürükleme tutacağı, ad, **ay rozeti** ("Kasım 2026" ya da "Henüz karşılanamıyor"), bekleme halkası ("12 gün kaldı"), **"≈ 2 iş günü"** maliyet ifadesi + kullanım başı maliyet, öncelik çipi (Acil+Önemli gibi, renk+ikon). Satırın sağında `Satın al`, `⋯` menü (Düzenle, Ertele, Vazgeç, Sil).
4. **Eisenhower görünümü** (SPEC'te var, şu an yok): 2×2 pano (Acil/Önemli), öğeleri sürükleyerek öncelik değiştirme.
5. **Zaman görünümü:** tek bir 12 aylık şerit; öğeler yerleştikleri aya konur (mevcut "timeline" kartının yerini alır; tekrar kalkar H8).
6. **Önizleme paneli (sağda yan panel / telefonda alt panel):** öğeye tıklayınca açılır; ekranın dibinde değil. İçinde:
   - "**Önce → sonra**" kartları (İstek kovası, serbest nakit, taksit yükü) ilerleme çubuklarıyla.
   - **Kural uyarıları anlaşılır cümlelerle** (H2 düzeltmesi): "Bu alım acil durum fonunu 6 aylık hedefin altına düşürür" + "Biliyorum" onayı.
   - "**Sığdığı ilk ay: Kasım**" + `Kasım için önizle`.
   - Ödeme yöntemi: `Peşin` / `Taksit` segmenti. Peşin: karar kaydı; Taksit: teklif tablosu (ay, aylık, toplam, bugünkü değer, reel tasarruf) + `Bu teklifi seç`.
   - **Kart seçimi** (kart widget'ı, banka rengiyle) + son ödeme ipucu ("Statement sonrası alırsan ödeme 31 gün gecikir").
   - Eylemler: `Onayla`, `Ertele`, `Vazgeç` (vazgeçince "₺X tasarruf ettin ≈ Y iş günü" kutlaması).

**Düğmeler (şimdiki envanter → hedef):**

| Şimdi | Hedef |
| --- | --- |
| `Add` (form) | `+ Öğe ekle` panelde; form sayfanın tepesinden kalkar |
| `Drag X to reorder`, `Move X up/down` | sürükleme tutacağı büyür; ↑↓ klavye ve ekran okuyucu için kalır, 44 px |
| `X` (ad düğmesi, seçer) | satıra tıklama önizlemeyi açar |
| `Edit X`, `Delete X` | `⋯` menüsü; silme = geri al |
| `Calculate with installments` | `Peşin / Taksit` segmenti içinde |
| `Confirm`, `Postpone`, `Skip`, `I know` | yeniden adlandırılır: `Satın aldım`, `Ertele`, `Vazgeç`, `Riski biliyorum` (ders bağlantılı) |
| `Pay with card` (select) | kart widget'ı seçici |
| lesson linkleri (Cost in life energy, Eisenhower) | ⓘ ile panel |

**Ek (SPEC geri listesi, onaylarsan):** fiyat 90 günden eskiyse "Fiyat hâlâ geçerli mi?" hatırlatması; 30 günlük beklemenin bitiminde "Hâlâ istiyor musun?" sorusu (açık soru, bkz. 11).
**Boş durum:** "Kuyruğun boş. Almayı düşündüğün bir şey ekle, hemen kararını sakinleştirelim." + `+ Öğe ekle` + "30 gün kuralı nedir?" ⓘ.
**Telefon:** liste tek sütun, önizleme alttan açılan panel, "Satın al" büyük düğme.
**Bağlantılar:** Plan (kova limitleri), Gelir-Gider (düzenli giderler zamanlayıcıyı etkiler), Kartlar (ödeme), Kararlar (kayıt), Profil (saatlik değer), Ledger (taksit).
**Kabul:** ekleme formu liste üstünü kaplamaz; önizleme seçimle birlikte görünür; ham kural kimliği hiçbir yerde görünmez.

### 5.6 Birikim kumbaraları (eski adı: Birikim hedefleri)

**Amaç:** para biriktirmek **görünür, keyifli ve alışkanlık** olmalı. Kullanıcı biriktirdikçe parayı **kendisi ekler**; uygulama her ay **ne kadar ayırması gerektiğini** söyler ve kalan parayı gösterir (2 Ekim kararı).
**Şimdi:** sayfa tepesinde form; altında satır başına tek ilerleme çubuğu; "Sinking funds" düz metin bağlantı. Para eklemenin yolu yok (kaydı baştan düzenlemek gerekiyor), animasyon yok.

**Hedef:**

1. **"Bu ay birikim planın" özeti (sayfanın kahramanı):**
   - Gelirinden **kalan:** ₺X (Ana sayfadaki sayıyla aynı kaynak).
   - Hedeflere **ayırman gereken:** ₺Y (kumbaraların bu ayki gereken tutarlarının toplamı).
   - Planın **önerdiği birikim:** ₺Z (aktif stratejiden, ör. 50/30/20'de gelirin %20'si).
   - Bu ay **ayırdığın:** ₺A (bu ayın para eklemelerinden).
   - Yığılı çubuk: `ayırdığın | hâlâ ayırman gereken | serbest kalan`.
   - Cümle: "Planına uymak için bu ay **₺B daha** ayırmalısın. Ayırdıktan sonra serbest harcayabileceğin **₺C** kalır."
   - `Önerilen dağılım` düğmesi: acil durum fonu hedefin altındaysa önce ona, sonra vadesi yakın hedeflere (Bebek Adımları mantığı); öneri, kullanıcı değiştirebilir.
2. **Kumbara kartları (ızgara):** her kart: ad, ikon/renk, **dolan kumbara görseli** (doluluk seviyesi), `₺3.500 / ₺12.000`, kalan süre, "bu ay gereken ₺2.400 · eklenen ₺1.000", durum çipi (Yolunda / Geride / Süresi doldu / Tamam), hızlı düğmeler `+ Para ekle`, `Para çek`, `⋯`.
3. **`+ Para ekle`** küçük panel: tutar (hızlı çipler: ₺100 · ₺500 · ₺1.000 · "bu ay kalan gereken"), tarih (varsayılan bugün), not (isteğe bağlı) → `Ekle`.
   - **Animasyon:** sikke kumbaraya düşer, doluluk seviyesi yükselir, sayı aşağıdan yukarı sayar, kısa titreşim; hedef %100 olunca kısa konfeti. **`prefers-reduced-motion` açıksa** animasyon yok, yalnızca renk/değer geçişi.
   - 5 saniyelik **geri al** toast'ı (yanlış tutar için).
4. **Para çek:** aynı panel; bakiyeden fazlası reddedilir ("Kumbarada yalnızca ₺X var").
5. **Geçmiş paneli:** kumbaraya tıklayınca: para ekleme/çekme listesi (tarih, tutar, not, düzenle/sil), birikim eğrisi ve hedef çizgisi, "bu hızla hedefe X ayda ulaşırsın".
6. **Acil durum fonu ilk kumbaradır:** sabit (silinmez), hedefi = aylık ihtiyaç × hedef ay (Profil'den); bakiyesi Profil'deki "acil durum birikimi" ile **aynı sayı**. Para eklenince Sağlık ve Ana sayfa anında güncellenir.
7. `+ Kumbara ekle` yan panel: şablon çipleri (Araba sigortası, Vergi, Tatil, Okul, Düğün...), ikon ve renk seçimi.

**Düğmeler:** `+ Kumbara ekle`, `+ Para ekle`, `Para çek`, `Önerilen dağılımı uygula`, `Düzenle`, `Sil (geri al)`, şablon çipleri, hızlı tutar çipleri.
**Boş durum:** "İlk kumbaran acil durum fonun. Bildiğin büyük giderler için de kumbara aç; her ay ne kadar ayıracağını hesaplayayım." + `Acil durum fonunu kur` + şablon çipleri.
**Telefon:** özet üstte, kumbaralar tek sütun, `+ Para ekle` büyük dokunma hedefi (44 px).
**Bağlantılar:** Ledger (aylık gereken tutar Plan'ın birikim kovasına ve Ana sayfaya girer), Sağlık (birikim oranı, acil durum), Plan (önerilen birikim), Takvim (vade), Kararlar (isteğe bağlı: "Vazgeçerek biriktirdiğini kumbaraya ekle" önerisi), AI dışa aktarma.
**Kabul:** para eklemek 2 dokunuş; ekleme anında animasyon çalışır (hareket azaltma açıkken çalışmaz); "ayırman gereken" ve "serbest kalan" sayıları Ana sayfa ile tutarlı; veri modeli ve hesaplar için bkz. 6.4.

### 5.7 Kartlar (+ ek kart, banka widget'ları)

**Amaç:** kartlarımı, limitlerimi, ödeme günlerimi ve kart borcunun risklerini yönetmek.
**Şimdi (ekran görüntüsü):** bir kart = bir satır metin ("Garanti Bonus: statement 15, due 5") + çöp kutusu; altında ekleme formu; altında her zaman açık "asgari ödeme" hesaplayıcısı ("Months to payoff: 600" yanıltıcı, H3). Çok ham.

**Hedef:** gerçek kart görselleri (ayrıntı 6. bölümde):

1. **Kart yığını:** her kart banka renginde bir `BankCard` widget'ı (ad, son 4 hane isteğe bağlı, ağ rozeti). **Ek kartlar ana kartın altında yığılı** (Apple Wallet gibi), bağlantıları belli.
2. **Kart ayrıntı paneli:** son ödeme günü, hesap kesim günü, limit kullanımı (ilerleme çubuğu), yaklaşan taksitler (bu karta bağlı alımlar), "bu kartla almak için en iyi gün" ipucu.
3. `+ Kart ekle`: yan panelde adım adım: banka seç (renkli ızgara) → kart adı → kart türü (Ana / Ek) → gün alanları → limit (ana kartta) → renk (özel).
4. **Asgari ödeme tuzağı:** "Araçlar" bölümünde **kapalı** (genişlet), ya da karttan "Sadece asgariyi ödersem?" düğmesiyle açılır ve o kartın borcu/faizi hazır gelir. Sonuç: "600 ay" yerine **"Asla bitmez (50 yıl içinde)"** ve toplam faiz uyarısı, ders bağlantısı.
5. **Yaklaşan son ödemeler** takvim bölümü.

**Düğmeler:** `+ Kart ekle`, `+ Ek kart ekle` (ana kartın içinde), `Düzenle`, `Sil` (ek kartı olan ana kartta: "ek kartlarla birlikte sil / ek kartları bağımsız yap"), `Sadece asgariyi ödersem?`, renk seçici.
**Boş durum:** "Kartlarını ekle; son ödeme tarihlerini ve limitini takip edelim, alışverişte vade ipucu vereyim." + banka ızgarası.
**Telefon:** kartlar yatay kaydırmalı şerit (cüzdan hissi), alttan panel.
**Bağlantılar:** Kuyruk (ödeme seçimi, vade ipucu), Ledger (karta bağlı taksit), Takvim (son ödeme), Guard (limit kuralı, bkz. 7), Sağlık (kart borcu), Dersler.
**Kabul:** ekran bir "cüzdan" gibi görünür; ek kart ana karta bağlıdır ve limiti paylaşır; asgari ödeme aracı varsayılan olarak kapalıdır.

### 5.8 Sağlık

**Amaç:** "mali durumum iyi mi, neyi düzeltmeliyim?" cevabı.
**Şimdi (ekran görüntüsü):** 4 küçük kart (birimsiz sayılar), altında bir bağlantı. Sayfanın %80'i boş. Savings rate 0% (H5) yanıltıcı.

**Hedef:**

1. **Durum özeti:** "Genel olarak: **Dikkat** (acil durum fonun hedefin altında)" + tek cümle neden + `Düzelt` düğmesi. *Yapay bir "puan" üretmeyeceğiz*, gerekçesiz sayı güvensizlik yaratır.
2. **Dört metrik kartı**, her biri: değer + **birim** ("3,5 ay"), **durum çipi** (iyi/dikkat/risk eşikleri veri olarak), **eğilim** (bkz. aylık anlık görüntüler), ⓘ (ne demek, nasıl hesaplanıyor, hangi ders), "ne yapmalı" tek satır.
   - Birikim oranı (H5 çözümü, 2 Ekim kararı): bu ayki **kumbara eklemeleri + düzenli birikim/yatırım kalemleri** ÷ net gelir. Artan para ayrıca "kalan" olarak gösterilir, birikim sayılmaz (bkz. 6.4).
   - Acil durum fonu (ay): halka.
   - Taksit yükü oranı: taksit/net gelir, **sınır çizgisi** (ayardaki üst sınır).
   - Pist (runway): "Gelirin durursa X ay dayanırsın".
3. **Eğilimler** 🆕: son aylar için mini grafikler (aylık anlık görüntü gerekir; bkz. 8, öneri 3).
4. **Sıradaki adımlar:** kural tabanlı 1–3 öneri kartı, her biri ilgili sayfaya götürür (örn. "Taksit yükün %26, sınır %20 → yeni taksitleri durdur / kuyruğu gözden geçir").
5. **Dersler:** "Room for error / enough" (Housel) kartı ve ilgili metriğin yanında ⓘ.

**Düğmeler:** `Düzelt`, her kartta ⓘ ve `Ayrıntı`, `Dersi oku`.
**Boş durum:** "Sağlığını görmek için gelirini ve giderlerini ekle." + bağlantı.
**Telefon:** kartlar 2 sütun, durum özeti üstte.
**Bağlantılar:** Profil (acil durum hedefi), Gelir-Gider (birikim/yatırım türü), Taksitler, Ayarlar (taksit sınırı), Anlık görüntüler (eğilim), Dersler.
**Kabul:** her sayı birimli, durumlu ve açıklamalı; sayfa boş görünmez; yanlış "%0 birikim" kalkar.

### 5.9 Kararlar

**Amaç:** davranışımın aynası: ne aldım, ne ertelediysem, neyi bıraktım ve bu bana ne kazandırdı.
**Şimdi (ekran görüntüsü):** bir toplam satırı ve **ham UUID** gösteren tek satır (H1). Boş durumda hiçbir şey. En zayıf sayfa.

**Hedef:**

1. **Üst istatistikler:** "Vazgeçerek biriktirdiğin: ₺4.000 ≈ **2,8 iş günü**" (saatlik değerle; Vicki Robin), "Aldıkların: ₺X", "Ertelenenler: N".
2. **Akış (zaman çizelgesi):** tarih grupları, her kayıtta **ürün adı** (H1: karar anında ad saklanır), sonuç çipi (Aldım/Ertelendi/Vazgeçildi), tutar, ve "**Riski bilerek onayladın**" rozeti (Guard onayı).
3. **Filtre:** `Hepsi / Aldım / Ertelendi / Vazgeçtim` (segment), ay seçici.
4. **Satır eylemleri:** `⋯`: "Sonucu değiştir" (örn. ertelediğimi sonra aldım), "Kuyruğa geri ekle" (vazgeçtiğimi tekrar düşün), silme (geri al).
5. **Nazik içgörü:** "Son 3 ayda isteklerinin %60'ını 30 günlük beklemeden sonra bıraktın" (kuralı çalıştığını gösteren motivasyon).

**Boş durum (öğretici):** "Burası alışveriş kararlarının günlüğü. Kuyruktan bir şeyi satın aldığında, ertelediğinde ya da vazgeçtiğinde kayıt burada birikir. **30 gün kuralını** biliyor musun?" + `Kuyruğa git` + ders kartı.
**Telefon:** tek sütun akış, filtre yatay.
**Bağlantılar:** Kuyruk (kaynağı ve geri ekleme), Profil (saatlik değer), Guard (onay kaydı), Ana sayfa (özet), AI export.
**Kabul:** hiçbir yerde ham kimlik yok; boş sayfa öğretici; toplam ayrıca iş günü olarak görünür.

### 5.10 Dersler

**Amaç:** "okul" vaadini taşımak: kitaplardan ve yatırımcılardan öğrenilen fikirlerin okunabilir, bağlamlı olması.
**Şimdi:** 10 uzun kart alt alta. Etiketler (Used in) yok, arama yok, okuma hissi yok.

**Hedef:** okuma deneyimi:

- Kart ızgarası (kapak: başlık, yazar, kitap, "kullanıldığı yer" çipleri: Plan, Sağlık...) → tıklayınca **okuma görünümü** (serif, geniş satır aralığı, bölümler: Fikir · Uygulama · Kime uyar · Sınırlar · Kaynak).
- **Arama** ve **etiket filtresi** (Plan, Kuyruk, Taksit, Yatırım...).
- **İlgili dersler** ve "Bunu uygulamada gör" bağlantıları (karşı yönde).
- Yerel "okudum" işareti (oyunlaştırma yok, sadece ilerleme: 4/10).
- Her ders sayfası kalıcı bağlantı (`/lessons#id` korunur); yan panel (Sheet) olarak diğer sayfalardan da açılır.
- İçerik kuralı: kendi sözlerimizle, kısa alıntı; **her kart orijinal kitapla karşılaştırılarak gözden geçirilir** (T3.16/T8.4'te yapıldı; yeni kartlarda yinelenecek).

**Düğmeler:** arama kutusu, etiket çipleri, `Okudum olarak işaretle`, `İlgili dersler`, `Uygulamada gör`.
**Boş durum:** arama sonuçsuzsa öneri.
**Kabul:** ders, ilgili sayının yanından panelde açılır; sayfada kaybolmadan okunur.

### 5.11 Ayarlar (+ AI'ya sor, veri, görünüm)

**Amaç:** tercihler, güvenlik, veri ve yardımcı özellikler. Şu an bir torba.
**Şimdi (ekran görüntüsü):** para birimi seçici, "Export backup" ve ham "Choose File", taksit üst sınırı, dil (`en`) ve örnek tutar (`TRY 123,456.78`). Gruplanmamış (H7).

**Hedef bölümler (soldan sekme ya da yığılı kartlar):**

1. **Genel:** Dil (adıyla: Türkçe/English + bayrak değil, ad), Para birimi, Görünüm (Sistem/Açık/Koyu), "Biçim önizlemesi" tutarlı `₺`.
2. **Kurallar:** taksit üst sınırı, **30 günlük bekleme süresi** (şimdi koda gömülü parametre, ayarlanabilir olur), acil durum eşikleri (iyi/dikkat) veri olarak.
3. **Veri:** `Yedeği indir` (JSON), `Yedeği içe aktar` (sürükle-bırak alanı, **önizleme**: "X kalem içe aktarılacak, mevcut veri değişecek" + onay), "Son yedek: 3 gün önce" ve yedek hatırlatması, `Tüm verimi sil` (yazarak onay).
4. **AI'ya sor** 🆕 (ayrıntı 6.3).
5. **Uygulamayı yükle:** PWA kurulum düğmesi + "çevrimdışı çalışır" durumu.
6. **Hakkında:** sürüm, lisans, gizlilik özeti ("verilerin cihazından çıkmaz"), "Bu uygulama mali tavsiye değildir" uyarısı, kaynaklar.

**Boş durum:** yok. **Telefon:** tek sütun, bölümler akordeon.
**Bağlantılar:** tüm modüller (veri), Kuyruk (bekleme süresi), Sağlık (eşikler).
**Kabul:** dil/para birimi okunabilir adlarla; içe aktarma önizlemeli ve geri alınamaz uyarılı; tüm tutarlar aynı biçimde.

---

## 6. Yeni özellikler

### 6.1 Ek kart (aynı limite bağlı) 🆕

**İstek:** kartın altına ek kart eklensin; aynı limite dahil olsun; son ödeme tarihleri farklı olabilsin; düzenlenebilsin; ek kart ana karta bağlı olsun.

**Model (geriye uyumlu, mevcut kayıtlar bozulmaz):**

```ts
interface Card {
  id: string;
  label: string;
  statementDay: number;         // var
  dueDay: number;               // var
  // yeni, hepsi isteğe bağlı (eski kayıtlar geçerli kalır):
  kind?: 'main' | 'supplementary';  // yoksa 'main'
  parentId?: string;                // ek kartta ana kartın id'si
  limit?: Minor;                    // yalnızca ana kartta; ek kart bunu paylaşır
  bankId?: string;                  // banka ön ayarı
  network?: 'visa' | 'mastercard' | 'troy' | 'amex' | 'other';
  last4?: string;                   // isteğe bağlı, gizlilik için sorulur
  color?: string;                   // özel renk (banka yoksa)
}
```

**Kurallar:**

- Ek kart yalnızca bir **ana karta** bağlanır (iç içe ek kart yok). Ek kartın kendi **hesap kesim ve son ödeme günü** olabilir (şimdiki alanlar zaten kartın başına).
- **Ortak limit:** kullanılan limit = ana kart + tüm ek kartların borcu. Borç iki yerden gelir: (a) isteğe bağlı elle girilen "güncel borç", (b) karta bağlı **kalan taksitler** (otomatik, Kuyruk'tan seçilen karta göre).
- Kullanılabilir limit = `limit − kullanılan`. Taksit alırken karta sığıp sığmadığı kontrol edilir (yeni guard kuralı, bkz. 7).
- **Silme:** ana kart silinirken ek kartları var ise sor: "Ek kartlarla birlikte sil" ya da "Ek kartları bağımsız ana karta çevir (limit gerekir)".
- **Düzenleme:** ek kartta limit alanı yok; "Limiti ana karttan paylaşır" bilgi satırı. Ana kartın limiti değişince ek kartlar anında günceller.
- **Arayüz:** `BankCard` yığını; ana kartın altında ek kartlar yarı görünür şekilde dizili; yığına tıklayınca açılır. `+ Ek kart ekle` ana kartın içinde.
- **Vade ipucu:** her kart kendi günleriyle `timingTip` üretir; kuyrukta kart seçince ek kart da seçenek olur ("Garanti Bonus · Ek kart: eşim").

**Testler:** ek kart olmadan eski kartlar parse eder; ek karta limit verilemez; ana kart silinince ek kart senaryoları; kalan taksit hesabı; ortak limit toplamı; yığın görünümü.

### 6.2 Banka ön ayarları ve kart widget'ı 🆕

- `packages/core/data/banks.json`: `{ id, name, colors: {from, to, text}, country }` ve Türkiye için yaygın bankalar + genel "Diğer" + özel renk.
- Kart widget'ı **renk degradesi + banka adı yazısıyla** çizilir; **logo kullanmıyoruz** (marka tescili; logo için ayrı izin gerekir). Bu kadarı "bankanın havasını" verir.
- ⚠ **Renk değerlerini ben tahmin etmeyeceğim:** her bankanın resmi marka rehberinden alınmalı ya da "yaklaşık renk" diye açıkça etiketlenmeli. (Bkz. 11. soru 6.)
- Telefon: kartlar yatay kaydırılan şerit.

### 6.3 "AI'ya sor": finansal durumu yapay zekâya aktarma 🆕

**İstek:** ikinci bir dışa aktarma: iyi bir promptla birlikte; tek tıkla "Claude'a sor", "ChatGPT'ye sor".

**Tasarım:**

1. **Ayarlar → "AI'ya sor"** bölümü ve Ana sayfa/Sağlık'ta kısayol düğmesi.
2. **Gizlilik seçimi (zorunlu adım, varsayılan en güvenlisi):**
   - *Tam ayrıntı* (gerçek tutarlar, gerçek etiketler),
   - *Yuvarlanmış* (tutarlar en yakın 100'e, etiketler genelleştirilmiş: "Maaş 1", "Kredi"),
   - *Yalnızca oranlar* (tutar yok; yüzdeler ve aylar).
   Kullanıcı **tam metni önizler** ve düzenleyebilir; neyin gönderileceği her zaman görünür.
3. **Prompt içeriği** (otomatik üretilir, kullanıcının diline göre TR/EN):
   - Rol ve ton: "Sakin, Stoacı bir mali danışman gibi davran; ama düzenlemeye tabi yatırım danışmanı değilsin."
   - **Kurallar:** "Aşağıdaki sayıları Stoafi hesapladı; yeni rakam uydurma, kendi hesabını yapman gerekirse varsayımını söyle. Emin olmadığın şeyi söyle. Tek seferde en fazla 3 öneri ver. Önce 2–3 netleştirici soru sor."
   - Para birimi ve **birim açıklaması** (tutarlar ana birimde, kuruş değil).
   - **Veriler:** profil (gelir, giderler, yaşam gideri, birikim, hedef), hesaplanmış durum (kalan para, sağlık metrikleri, kova kullanımı, 12 aylık nakit akışı), aktif plan ve uyarıları, kuyruk (öğe, fiyat, zamanlanan ay), taksitler, birikim hedefleri, kartlar (limit, vadeler), son kararlar.
   - **Açılış sorusu seçenekleri** (çip): "Bütçemi değerlendir", "Bu ay neyi kısmalıyım?", "[ürün] alınır mı?", "Taksit mi peşin mi?", "Acil durum fonuma nasıl daha hızlı ulaşırım?", "Serbest soru".
   - **Dersler:** "Önerilerini mümkünse şu kaynaklara dayandır: 50/30/20 (Warren), ... " (kullanılan stratejinin kartı).
4. **Butonlar:**
   - `Promptu kopyala` (birincil, her zaman çalışır),
   - `Claude'a sor` ve `ChatGPT'ye sor`: promptu panoya kopyalar **ve** ilgili sitenin yeni sohbet sayfasını yeni sekmede açar; "Yapıştır ve gönder" yönergesi gösterir,
   - `Dosya olarak indir` (.md/.txt),
   - isteğe bağlı: Gemini, Perplexity ekleme (onayına bağlı).
   - Neden URL ile önceden doldurmuyoruz? Tam veri **adres satırına** girer; tarayıcı geçmişine ve sunucu günlüklerine sızar, uzun adresler de kırpılır. Pano + yeni sekme hem güvenli hem sağlam. (Kısa, veri içermeyen bir "boş sohbet" açılışı güvenli.)
5. **Logolar:** düğmelerde marka simgesi kullanmak istiyorsun. **Her firmanın marka kullanım kuralına uymak gerek** (özellikle ürün içinde logo kullanımı). Önerim: önce nötr ikon + ad ile çıkalım; logoyu, ilgili marka kurallarını doğruladıktan sonra ekleyelim. (Bkz. 11. soru 7.)
6. **Ağ ve ilkeler:** uygulama kendisi **hiçbir istek atmaz**; yeni sekme açmak kullanıcının eylemi. SPEC'in "AI rakam üretmez" ilkesi uygulamanın **kendi hesapları** için geçerli; dışarıda kullanıcının yaptığı sohbet onun tercihi, prompt "sayıları Stoafi hesapladı" der. Bu yorumu **sen onaylamalısın** (CLAUDE.md "ağ çağrısı yok" kuralı; bkz. 11. soru 4).
7. **Güvenlik uyarısı:** "Bu veriler seçtiğin yapay zekâ servisine gidecek, orası kendi gizlilik politikasına tabi" metni her seferinde.
**Nasıl görünür (örnek, kısaltılmış):**

```text
Rolün: Sakin, Stoacı bir kişisel finans danışmanı gibi konuş. Düzenlemeye tabi bir yatırım danışmanı değilsin.
Kurallar: Aşağıdaki rakamları Stoafi uygulaması hesapladı; yeni rakam uydurma. Kendi hesabını yapman
gerekirse varsayımını söyle. Emin olmadığın yerde söyle. Önce 2-3 netleştirici soru sor, sonra en fazla 3 öneri ver.
Para birimi: TRY. Tutarlar lira cinsindendir (kuruş değil).

--- STOAFI VERİLERİM (Yuvarlanmış seviye) ---
Net gelir: 45.000 (Maaş 1)
Düzenli giderler: Kira 14.000 (ihtiyaç), Abonelik 300 (istek)
Yaşam gideri: 9.000
Acil durum birikimi: 80.000 (hedef 6 ay, şu an 3,5 ay)
Bu ay kalan: 21.700
Plan: 50/30/20 (kaynak: Elizabeth Warren, All Your Worth)
Kuyruk: Kulaklık 2.500 (Kasım'da sığıyor), Laptop 32.000 (12 ay içinde sığmıyor)
Son kararlar: Mont 4.000 vazgeçildi
--- SORUM ---
Bu ay neyi kısmalıyım?
```

**Ne olur:** `Claude'a sor`a basarsın → uygulama yukarıdaki metni panoya kopyalar ve Claude'un sohbet sayfasını yeni sekmede açar → sen **Yapıştır + Gönder** dersin → yapay zekâ, senin gerçek durumunu bilerek sohbet eder. Uygulama kendisi hiçbir şey **göndermez**; metni sen yapıştırıp gönderirsin ve ne gittiğini önceden tam olarak görürsün.

8. **Test:** prompt üretimi saf bir fonksiyon (`buildAiExport`) olarak çekirdekte, her gizlilik seviyesi için testli; birimlerin ana birim olduğu, hassas alanların seviyeye göre elendiği doğrulanır.

### 6.4 Kumbara veri modeli ve hesaplar 🆕

**Model (geriye uyumlu: eski kayıtlar geçerli kalır):**

```ts
interface SinkingFund {
  id: string;
  label: string;
  target: Minor;
  dueMonth: Month;
  currentBalance: Minor;        // toplam bakiye (var)
  // yeni, hepsi isteğe bağlı:
  icon?: string;                // ikon adı
  color?: string;               // renk jetonu
  kind?: 'goal' | 'emergency';  // 'emergency' tek ve silinemez; yoksa 'goal'
  deposits?: { id: string; date: string /* yyyy-mm-dd */; amount: Minor /* + ekleme, - çekme */; note?: string }[];
}
```

- `currentBalance` toplam olarak kalır. Para ekleme/çekme tek bir saf işlemle hem `deposits`'e kayıt ekler hem bakiyeyi günceller (`addDeposit`, `removeDeposit`, `editDeposit`). **Bakiye eksiye düşemez.** Çekme bakiyeden fazlaysa reddedilir.
- **Acil durum kumbarası** tek kaynaktır: bakiyesi `Profile.savings` ile aynıdır; ikisi **tek işlemde birlikte** yazılır ve ayrışamaz (test: ekle, çek, düzenle, içe aktar sonrası eşit kalır). Profil formundaki "birikim" alanı bu kumbaranın bakiyesini gösterir.

**Hesaplar (çekirdekte, saf ve testli):**

| Fonksiyon | Ne yapar |
| --- | --- |
| `requiredThisMonth(fund, month)` | aktif: aylık ayırma; vadesi bu ay: eksik tutar; tamam/geçmiş: 0 |
| `depositedInMonth(fund, month)` | o ayın para eklemeleri − çekmeler |
| `monthlySavingsAdvice({ left, planSavings, funds, month })` | `{ required, deposited, stillToSet, freeAfter, suggestedSplit }` |
| `suggestedSplit` | önce acil durum hedefin altındaysa ona, sonra vadesi en yakın hedeflere; toplam `stillToSet`'i geçmez |
| `savingsRate(...)` (Sağlık) | (ayın eklemeleri + düzenli birikim/yatırım kalemleri) ÷ net gelir |

**Kenar durumlar (testle):** hiç kumbara yok; hedef zaten tamam; vadesi bu ay/geçmiş; bu ay hiç eklenmemiş; eklenen gereken tutarı aşmış (taşan para "ekstra"); çok büyük tutar; kuruş yuvarlama; aynı gün birden fazla ekleme; çekme sonrası bakiye 0; içe aktarılan eski kayıtlarda `deposits` yok.

**Animasyon (davranıştan ayrı):** mantık animasyondan bağımsızdır; animasyon yalnızca görsel katmandır, kapatılabilir ve test edilebilirliği bozmaz.

---

## 7. Modüllerin birbirine bağlanması

### 7.1 Bugünkü veri akışı

```
Gelir/Gider (profil) ──► Ledger ◄── Kuyruk (taksit alımları)
        │                  ▲  ▲
        │                  │  └── Birikim hedefleri (aylık ayırma)
        ▼                  │
   Aylık projeksiyon (türetilir, saklanmaz) ──► Ana sayfa · Plan · Sağlık · Kuyruk önizlemesi · Guard
                               ▲
                  Plan (strateji → kova limitleri)
Kartlar ── (tek bağ) ──► Kuyruk önizlemesi (vade ipucu)
Kararlar ◄── Kuyruk (satın al / ertele / vazgeç)
Dersler ◄── (yalnızca bağlantı; bağlamsal değil)
```

### 7.2 Eksik ve zayıf bağlar

| # | Eksik | Sonuç |
| --- | --- | --- |
| B1 | Gelir/gider **günleri** (maaş, vade, kart son ödeme) hiçbir yerde görünmüyor | alanlar var ama değer katmıyor |
| B2 | Kart ↔ taksit alımı bağı yok (`cardId` kaydedilmiyor) | kart limiti/borcu hesaplanamıyor |
| B3 | Kart limiti ve guard kuralı yok | kart limitini aşan taksit uyarısız onaylanıyor |
| B4 | Birikim/yatırım "düzenli kalemi" girilemiyor | Sağlık birikim oranı hep 0 (H5), Plan'da birikim kovası boş görünür |
| B5 | Saatlik değer (Profil) Kuyruk'taki "çalışma saati"yle bağlı ama Profil'de görünmüyor | kullanıcı sayının kaynağını bilmiyor |
| B6 | Kararlar ↔ Kuyruk tek yönlü, ürün adı saklanmıyor (H1) | geri ekleme/sonuç değiştirme yok |
| B7 | Sağlık için **geçmiş yok** (her şey "şu an") | eğilim/ilerleme gösterilemiyor; "3 ay açıp bakma" başarı ölçütünü ölçemiyoruz |
| B8 | Dersler bağlamsız | okul vaadi zayıf |
| B9 | AI dışa aktarma yok | yeni istek |
| B10 | Plan uyarıları eyleme bağlı değil | "ne yapayım?" boşta |

### 7.3 Hedef bağlantı haritası

```
                       ┌────────────── Dersler (ⓘ panel, her sayının yanında) ───────────────┐
                       │                                                                      │
Profil/Gelir-Gider ──► Ledger ◄─ Kuyruk(taksit,kart) ◄─ Kartlar(limit, ek kart, vade)         │
  (günler, türler)       ▲  ▲                              │                                  │
                         │  └ Birikim hedefleri             ▼                                  │
                         │                              Guard (acil fon, taksit sınırı, kova, KART LİMİTİ)
                         ▼                                  │
                 Aylık projeksiyon ──► Takvim (yaklaşan ödemeler)                               │
                         │                                                                      │
                         ├──► Ana sayfa · Plan · Sağlık ◄── Aylık anlık görüntüler (eğilim) ────┘
                         └──► AI dışa aktarma (salt okunur, hepsini okur)
Kuyruk ◄──► Kararlar (ad saklı, sonuç değişir, geri ekle)
```

---

## 8. Önerilerim (onayını bekleyenler)

Her birine **E / H / sonra** diyebilirsin. Tahmini yük: S küçük, M orta, L büyük.

| # | Öneri | Neden | Yük |
| --- | --- | --- | --- |
| S1 | **Aylık takvim** ("Yaklaşan ödemeler"): maaş günü, gider vadeleri, kart son ödemeleri (B1) | Hazır alanlara değer katar; "bu hafta ne ödeyeceğim?" cevabı | M |
| S2 | **Düzenli birikim/yatırım gider türü** (B4) | Birikim oranı doğru olur, plan kovaları anlam kazanır | S |
| S3 | **Aylık anlık görüntüler**: ay değişince metrikleri yerel sakla (B7) | Eğilim grafikleri, "3 ay kullandım mı?" ölçütü | M |
| S4 | **Karta bağlı taksit + kart limiti guard'ı** (B2, B3) | Ek kart/ortak limit özelliği anlam kazanır | M |
| S5 | **Demo modu** (örnek profil, tek tıkla) | İlk deneyim, portföy ziyaretçileri, e2e testleri | S |
| S6 | **Komut paleti (⌘K) ve klavye kısayolları** | Hız hissi; Linear tarzı | M |
| S7 | **Geri al (undo)** her silmede | Güven; hata affı | S |
| S8 | **Fiyat güncelliği hatırlatması** (90 gün) | SPEC geri listesi; kuyruk güvenilirliği | S |
| S9 | **Uygulama kilidi (PIN) ve "tutarları gizle"** | Finans için gizlilik; müşteri beklentisi | M |
| S10 | **İsteğe bağlı hesap bakiyesi** → "maaş gününe yeter mi?" günlük görünüm | YNAB benzeri güçlü özellik; ama veri girişi yükü getirir (ilke 4) | L |
| S11 | **Abonelik denetimi** (yıllık maliyet, "hâlâ kullanıyor musun?") | SPEC geri listesi; `isSubscription` alanı zaten var | M |
| S12 | **Senaryo simülatörü** ("maaşım düşerse / zam gelirse") | SPEC geri listesi; çekirdek hesaba hazır | L |
| S13 | ~~Her PR için önizleme sitesi~~ **Vazgeçildi** (2 Ekim: yerelde açıyorsun; değişiklikleri `git fetch` ile alırsın) | – | – |
| S14 | **Kabul (küçük tutulur):** repo içinde tarayıcı testleri (Playwright) + CI'da çalıştırma + erişilebilirlik taraması (axe)** | Bu turdaki "ekran kötü ama testler yeşil" sorununu bitirir | M |
| S15 | **Yedek hatırlatması** ("son yedek 30 gün önce") | Veri yalnızca cihazda; kaybı önler | S |
| S16 | **Paylaşılabilir "plan özeti" görseli/PDF** | Danışmana/eşe göstermek için | M |
| S17 | **Hanehalkı/çoklu profil** | Eşle ortak kullanım | L (ertelemeyi öneririm) |
| ✖ | **Bildirimler** (vade hatırlatma) | Sunucusuz güvenilir yerel bildirim bugün tarayıcılarda sağlam değil; sunucu gerektirir. **Önermiyorum**, takvim (S1) ve PWA ekranı yeterli | – |

**Karar durumu (2 Ekim):** S1, S2, S3, S4, S5, S7, S14 **kabul**. S13 **vazgeçildi**. S6, S8, S9, S11, S15, S16 **kabul, Faz 14 / Faz 13'te** (önceki sıramdaki yerleri). S10, S12, S17 **şimdi yok**, istersen eklerim.

**Tarayıcı testleri (S14), "lazımsa ekle" sorusuna cevabım: lazım, ama küçük.** Bu turda "ekranlar kötü ama bütün testler yeşil" durumuna düştük, çünkü birim testleri ekranın telefonda taşıp taşmadığını ya da boş sayfanın ölü görünüp görünmediğini bilmez. Önerim: her sayfa için **tek bir duman testi** (açılıyor mu, konsol hatası var mı, telefonda yatay kayma var mı, ana düğme çalışıyor mu) + **erişilebilirlik taraması**. Yaklaşık 15 kısa test, CI'a 1-2 dakika ekler. Uzun senaryolar yok. Beğenmezsen sonra kaldırılır, ama bence en çok bu turdaki türden hataları önler.

---

## 9. Müşteriye hazır olma listesi

**Ürün ve içerik**

- [ ] Onboarding + demo modu
- [ ] Tüm ekranlarda boş/yükleniyor/hata durumları
- [ ] TR metinlerinin anadil okuması (şu an benim yazdığım; kullanıcıya özel ton gözden geçirilmeli)
- [ ] Her ders kartı orijinal kitapla karşılaştırıldı (yeni kartlarda yinelenecek)
- [ ] "Bu uygulama mali/yatırım tavsiyesi değildir" ve gizlilik metni

**Güvenlik ve gizlilik**

- [ ] Veri yalnızca cihazda; **şifresiz IndexedDB** olduğu açıkça yazılır
- [ ] Uygulama kilidi (PIN) ve tutarları gizle (S9)
- [ ] Yedek dosyası hassas veri içerir: indirirken uyarı
- [ ] AI aktarımı: gizlilik seviyeleri + önizleme + her seferinde uyarı
- [ ] Hiçbir analitik/uzak yazı tipi/uzak istek (otomatik tarama ile doğrulanır)
- [ ] Güvenlik başlıkları (CSP) statik dağıtımda ayarlanır

**Kalite**

- [ ] Tarayıcı testleri (Playwright) CI'da, telefon + masaüstü, boş + dolu (S14)
- [ ] Erişilebilirlik: axe taraması, klavye, odak, kontrast, 44 px hedef
- [ ] Performans bütçesi: ilk yükleme, bundle (recharts ağırlığı değerlendirilir)
- [ ] Hata sınırı (error boundary) ve yerel hata kaydı ("sorun bildir" metni kopyalar)
- [ ] Veri sürümleme: eski sürüm veri fixture'larıyla migrasyon testleri
- [ ] Eski formatta yedek içe aktarma (şimdi reddediliyor)

**Yayın**

- [ ] PWA cihazda doğrulama (T8.6: telefon + Mac; elle)
- [ ] Önizleme/üretim dağıtımı (S13), alan adı
- [ ] **Ürün adı, alan adı ve lisans kararı** (açık sorular)
- [ ] README, ekran görüntüleri, sürüm notları
- [ ] Marka varlıkları (logo, ikon, sosyal önizleme)

---

## 10. Yol haritası

> Sıra: **temeli bir kez kur, sonra sayfa sayfa git.** Her sayfa: ekran görüntüsü → senin onayın → sonraki sayfa. Hepsini tek seferde değiştirmiyoruz.

### Faz 11: Temel (önce bu; sonraki her şey buna dayanır)

1. **T11.1** Gerçek hataları düzelt (H1–H3, H5–H7 kısmen): karar kaydında ürün adı, kural uyarılarının çevirisi, asgari ödemede "asla bitmez", ülke saklama, birimler, ayar etiketleri.
2. **T11.2** Tasarım jetonları (renk, tipografi, boşluk, koyu tema) ve tema seçici.
3. **T11.3** Ortak bileşen kütüphanesi (3.4'teki liste) + hareket altyapısı (`motion`, hareket azaltma) + hazır bileşen kaynağı kararı (3.6).
4. **T11.4** Uygulama kabuğu: gruplu kenar çubuğu, telefon alt sekme çubuğu, sayfa başlık çubuğu, atla bağlantısı.
5. **T11.5** Geri bildirim kalıbı: toast, geri al, onay penceresi, otomatik kaydet.
6. **T11.6** Küçük tarayıcı duman testleri (Playwright) + erişilebilirlik taraması (axe), CI'da (S14).

### Faz 12: Sayfa sayfa (her biri ayrı onay)

Önerdiğim sıra (en çok değer + bağımlılık sırasıyla):

1. **Ana sayfa** (5.1): kahraman kart, kova çubukları, yaklaşan ödemeler
2. **Kartlar** (5.7 + 6.1 + 6.2): ek kart, banka widget'ları, asgari ödeme gizli
3. **Kuyruk** (5.5): panel, önizleme yan paneli, Eisenhower, zaman şeridi
4. **Gelir-Gider ve Profil** (5.2, 5.3): birikim türü (S2), saatlik değer
5. **Plan** (5.4): kova kullanımı, ders paneli, yatırım bağlamı
6. **Sağlık** (5.8): durum, birimler, eğilim (S3)
7. **Kararlar** (5.9)
8. **Birikim kumbaraları** (5.6, 6.4): para ekle, animasyon, "ayırman gereken"
9. **Dersler** (5.10)
10. **Ayarlar + AI'ya sor** (5.11, 6.3)
11. **Onboarding + demo** (5.0, S5)

### Faz 13: Bağlantılar

Takvim (S1), karta bağlı taksit ve limit guard'ı (S4), anlık görüntüler (S3), fiyat güncelliği (S8), geri al (S7), komut paleti (S6).

### Faz 14: Müşteriye hazır

Güvenlik/gizlilik (S9, CSP), hata sınırı, migrasyon fixture'ları, eski yedek içe aktarma, erişilebilirlik cilası, performans, TR dil incelemesi, cihaz testi (T8.6), dağıtım, ürün adı/lisans, sürüm.

---

## 11. Kararlar ve kalan sorular

### 11.1 Verdiğin kararlar (2 Ekim)

| # | Karar | Plana nasıl girdi |
| --- | --- | --- |
| 2 | Daha tatlı, çok daha güzel UI/UX; hazır bileşen kütüphanelerinden yararlanılabilir (21st.dev vb.) | 3.6 (dürüst durum + iki yol + arama listesi), tasarım jetonları ve koyu tema |
| 3 | Birikim: kullanıcı biriktikçe **kendisi ekler** (kumbara); uygulama **kalan parayı ve ayırması gereken tutarı** gösterir; ekleme **animasyonlu**; kartlar gerçek kart gibi | 5.6, 6.4, 5.7, 5.8 (birikim oranı tanımı), 5.1 |
| 10 | Öneriler kabul (S13 vazgeçildi, S14 küçük) | 8. bölüm "Karar durumu" |
| – | Önizleme sitesi gereksiz (yerelde açıyorsun) | T11.7 kalktı |

### 11.2 Açıkladığım soru (1): "AI'ya sor"

Tam anlamadığın şey büyük ihtimalle şuydu: **uygulamaya yapay zekâ koymuyoruz.** Eklediğimiz şey bir **hazır metin üretici**. 6.3'te örneği var. Özet: tıklayınca, durumunu ve iyi yazılmış talimatları içeren bir metin hazırlıyor, panoya kopyalıyor, Claude/ChatGPT sayfasını yeni sekmede açıyor; sen yapıştırıp gönderiyorsun ve gerçek durumunu bilen bir yapay zekâyla sohbet ediyorsun.

**Senden net bir cevap lazım (E/H):** bu, "ağ çağrısı yok" kuralımızı bozmuyor mu? Benim yorumum: bozmuyor, çünkü **uygulama kendisi hiçbir istek atmıyor**; yeni sekmeyi açan ve metni gönderen sensin ve neyin gittiğini önceden tam görüyorsun. Kabul edersen SPEC'e "Export for AI chat" olarak eklerim.

### 11.3 Hâlâ cevap bekleyenler (cevap vermezsen **önerimle** ilerlerim)

| # | Soru | Önerim |
| --- | --- | --- |
| 1 | Marka yönü: derin yeşil-turkuaz + kehribar vurgu, sakin/Stoacı ton | evet |
| 4 | AI'ya sor: yukarıdaki E/H | evet |
| 6 | Banka renkleri: "yaklaşık renk" etiketi, sonra doğrulama; logo yok; öncelikli bankaları sen söyle | evet |
| 7 | Claude/ChatGPT düğmeleri: önce nötr ikon + ad, marka kurallarını doğrulayınca resmi logo | evet |
| 8 | 30 günlük bekleme bitince "Hâlâ istiyor musun?" ve "Ertele" beklemeyi sıfırlasın | ikisi de evet |
| 11 | Telefonda alt sekme çubuğu (5 öğe + Daha fazla) | evet |
| 12 | Sayfa sırası: Ana sayfa → Kartlar → Kuyruk | evet |
| 13 🆕 | **Tarihsiz kumbara** (tatil gibi, vadesi yok): şimdi her kumbaranın vade ayı zorunlu. Vadesiz olunca "aylık hedef" kullanıcıdan istenir | evet (Faz 12'de) |
| 14 🆕 | Acil durum birikimi, "Birikim" alanı olarak değil, **ilk kumbara** olarak görünsün (bakiye aynı sayı, tek kaynak) | evet |
| 15 🆕 | Yeni bağımlılıklar: `motion`, küçük konfeti, shadcn yapı taşları (`dialog`, `tabs`, `sonner`, `cmdk`), self-host yazı tipleri | evet |
| 16 🆕 | Bileşen kaynağı: iki yolun karışımı (3.6): sen 21st.dev'den seçersen ben uyarlarım, seçmediğin yerleri ben yazarım | evet |

**Başlamak için** yalnızca "başla" demen yeter. Önerimle **Faz 11'in T11.1'i** (gerçek hataların düzeltilmesi) ile giriyorum, sonra tasarım temeli, sonra sayfa sayfa.
