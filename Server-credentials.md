Sunucu Detayları
=============================

Terminal SSh connection
ssh root@104.247.166.189


TR-VPS-2

Ana IP Adresi: 104.247.166.189
Root Şifresi: 1095ObdXkEhziG23ZI

Verilen IP Adresleri: 

2a06:41c0:1:1::7050:a923

Sunucu Adı: server.markaworld.com.tr

Kontrol Paneli Bilgilendirmesi
=============================
Sisteminizde bir kontrol paneli bulunmamaktadır. Bir destek talebi oluşturarak istediğiniz kontrol panelinin kurulumunu talep edebilirsiniz. Desteklediğimiz kontrol panelleri bu şekildedir: cPanel, Plesk, Directadmin, Cyberpanel, Centos Web Panel

SSH Erişim Bilgisi
=============================
Ana IP Adresi: 104.247.166.189
Sunucu Adı: server.markaworld.com.tr

SSH'e putty isimli ücretsiz programla girebilirsiniz:
http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html

Ek Özellikler
=============================
Trafik takibini, müşteri panelinizden VPS detaylarına girerek görüntüleyebilirsiniz. Ayrıca aynı sayfada tekrar kurulum, resetleme vb.. işlemlerinizi yapabilmektesiniz.

 

Önemli: Trafik takibinizi yaparak trafik kullanımınızı uygun şekilde düzenlemeniz gerekmektedir. Trafik dolduğunda hizmet erişimi kesilir.

Yedekleme Bilgilendirmesi
=============================
VPS'leriniz günlük olarak yedeklenmektedir ancak sadece disk arızası vb. durumlarda kullanılabilir, isteğiniz üzerine kurulamaz ya da size teslim edilemez. Bununla birlikte, lütfen belirli aralıklarla kendiniz de yedekleme yapınız ve bilgisayarınıza indiriniz. Olası bir sorunda verilerinizin güvenliğini garanti etmemekteyiz, aldığımız yedeklerin herhangi bir sebeple arızalı olması vb. gibi bir durumda sorumluluk kabul edilmemektedir.



nginx version: nginx/1.18.0 (Ubuntu)
pm2 version : 6.0.8

---

# Kurulum Adımları ve Son Durum (Güncel)

1. Sunucuya SSH ile bağlanıldı.
2. Node.js v22.17.0 kuruldu.
3. Nginx kuruldu (v1.18.0).
4. PM2 kuruldu (v6.0.8).
5. /var/www/markaworld klasörü oluşturuldu.
6. Proje Github'dan klonlandı: https://github.com/enesxunal/markaworld-g.git
7. Backend kuruldu: `cd /var/www/markaworld/server && npm install`
8. Frontend kuruldu ve build alındı: `cd /var/www/markaworld/client && npm install && npm run build`
9. PM2 ile backend başlatıldı:
   ```bash
   cd /var/www/markaworld/server
   pm2 start index.js --name markaworld-backend
   pm2 save
   pm2 startup
   ```
10. Nginx konfigürasyonu oluşturuldu:
    - `/etc/nginx/sites-available/markaworld` dosyası oluşturuldu ve ayarlar eklendi.
    - Aktifleştirildi: `ln -s /etc/nginx/sites-available/markaworld /etc/nginx/sites-enabled/`
    - Test edildi: `nginx -t`
    - Yeniden başlatılırken hata alındı:
      - `systemctl restart nginx` komutu hata verdi.
      - Hata: `conflicting server name "_" on 0.0.0.0:80, ignored` ve restart başarısız.

## Sıradaki Adım

- Nginx'in neden başlatılamadığını bulmak için aşağıdaki komutları çalıştır:
  ```bash
  systemctl status nginx.service
  journalctl -xeu nginx.service
  ```
- Büyük ihtimalle aynı portta başka bir site tanımı veya çakışan bir ayar var. Gerekirse `/etc/nginx/sites-enabled/` içindeki diğer dosyaları sil veya devre dışı bırak.

Bir sonraki adımda nginx hatasını çözüp yayına devam edeceğiz!

whoami