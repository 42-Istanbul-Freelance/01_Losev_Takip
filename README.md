# LÖSEV İNCİ GÖNÜLLÜLÜK TAKİP SİSTEMİ

Bu doküman, LÖSEV tarafından paylaşılan örnek slayt içeriği temel alınarak hazırlanmış bir referans metindir.
Etkinlikte bu projeyi seçen ekipler, bu çerçeve üzerinden ilerleyebilir.

## Proje Özeti

LÖSEV İnci öğrencilerinin sosyal sorumluluk çalışmalarını kayıt altına alan, doğrulayan ve raporlayan bir takip sistemi fikridir.

## Projenin Amacı

Sistemin hedefi:

- Sosyal sorumluluk çalışmalarını düzenli takip etmek
- Gönüllülük saatlerini kayıt altına almak
- Okul bazlı performans ölçümü yapmak
- Türkiye geneli etki analizi oluşturmak
- Üniversite başvurularında kullanılabilecek dijital gönüllülük dokümanı üretmek

## Hedef Kitle

- Ortaokul öğrencileri
- Lise öğrencileri
- Okul koordinatör öğretmenleri
- Genel merkez raporlama birimi

Tasarımın bu farklı kullanıcı bakışlarını desteklemesi beklenir.

## Sistemin Ana Yapısı

### 1) Öğrenci Giriş ve Profil Alanı

Öğrenci sisteme giriş yaptığında aşağıdaki bilgiler alınabilir:

- Ad Soyad
- T.C. Kimlik No (opsiyonel, KVKK uygunluğu gözetilerek)
- Okul adı
- İl/ilçe
- Sınıf
- GSM
- E-posta
- Koordinatör öğretmen adı

### 2) Faaliyet Giriş Alanı

Öğrenci, gerçekleştirdiği gönüllülük faaliyetini sisteme ekleyebilir:

- Etkinlik tarihi
- Etkinlik türü
- Harcanan saat
- Kısa açıklama
- Fotoğraf yükleme
- Belge yükleme

Etkinlik türü örnekleri:

- Seminer
- Stant
- Bağış
- Kermes
- Kamuoyu bilinçlendirme
- Sosyal medya çalışması
- Farkındalık etkinliği

### 3) Saat Takip Alanı

Sistem aşağıdaki değerleri otomatik hesaplayabilir:

- Toplam gönüllülük saati
- Aylık saat
- Yıllık saat
- Hedef saat (30 veya 40 saat gibi)

## Örnek Yol Haritası (Zorunlu Değil)

Bu bölüm sadece fikir vermesi için eklenmiştir. Ekipler kendi planını oluşturabilir.

1. Adım: Rol ve veri modelini netleştirin

- Öğrenci, öğretmen ve genel merkez rollerini belirleyin
- Hangi bilgilerin zorunlu/opsiyonel olacağını tanımlayın
- Faaliyet, saat ve onay verilerinin temel yapısını çıkarın

2. Adım: Öğrenci tarafını geliştirin

- Profil formu
- Faaliyet ekleme formu
- Saat takip ekranı (toplam, aylık, yıllık)

3. Adım: Öğretmen panelini geliştirin

- Etkinlik onay/reddetme akışı
- Gerekirse düzenleme notu ekleme
- Okul bazlı özet görünümü

4. Adım: Genel merkez ve raporlama

- Okul/il bazlı temel istatistikler
- En aktif öğrenci/okul listeleri
- Grafik veya tablo ile özet ekranı

5. Adım: Sertifika ve demo hazırlığı

- Saate bağlı rozet mantığını ekleyin
- Kısa bir uçtan uca demo senaryosu hazırlayın

## Teknoloji Alternatifleri (Zorunlu Değil)

Bu önerilerden birini seçebilir veya farklı bir teknoloji kullanabilirsiniz.

- Ön yüz (web): React veya Vue veya Next.js
- Arka yüz (API): Node.js (Express/NestJS) veya Python (FastAPI/Django)
- Veri tabanı: PostgreSQL veya MySQL veya SQLite
- Kimlik doğrulama: Firebase Auth veya Supabase Auth veya JWT tabanlı giriş
- Dosya yükleme: Supabase Storage veya Firebase Storage veya Cloudinary
- Grafik/raporlama: Chart.js veya ECharts

## Öğretmen Paneli

Koordinatör öğretmen için önerilen işlevler:

- Öğrencinin girdiği etkinlikleri onaylama
- Gerekirse düzenleme talep etme
- Okul bazlı toplam saat raporunu görme
- Okul performans grafiğini inceleme

## Genel Merkez Takip Alanı

Kurumsal ölçekte üretilebilecek çıktılar:

- Okul bazlı sıralama
- İl bazlı etki haritası
- Toplam gönüllü saati
- En aktif 10 öğrenci
- En aktif 10 okul
- Aylık faaliyet dağılım grafiği
- Etkinlik türüne göre istatistik

## Dijital Sertifika Sistemi

Toplam saat üzerinden rozet/sertifika kurgusu:

- 25 saat: Bronz İnci
- 50 saat: Gümüş İnci
- 100 saat: Altın İnci
- 200+ saat: Platin İnci Lideri

Bu rozetler öğrenci profilinde görünür hale getirilebilir.

## Okul Performans Rozetleri

- İnci Dostu Okul
- Sosyal Etki Lideri Okul
- Yılın En Aktif İnci Okulu

Temel amaç rekabet değil, motivasyondur.

## Güvenlik ve KVKK

Çocuk verisi işlendiği için güvenlik önceliklidir. Tasarımda:

- Öğrenci verileri güvenli ve şifreli şekilde saklanmalı
- Fotoğraf yüklemeleri onay mekanizmasına bağlı olmalı
- Veli dijital izin süreci düşünülmeli
- Veriler yalnızca LÖSEV amacıyla kullanılmalı

## Raporlama

Sistem, aşağıdaki türde çıktılar üretebilir:

- "İstanbul Avrupa İnci öğrencileri toplam ... saat gönüllülük yaptı"
- Türkiye geneli toplam gönüllülük saati
- En çok yapılan faaliyet türü
- Yıllık etki özeti