// Google Sheets verilerini çekme ve HTML'e enjekte etme
const SHEET_ID = '1NFUc139dLSxxob2t59L9rOFKfdOK2UJ9Ck3omSQoGU4';

// Google Sheets'ten veri çekme fonksiyonu (gviz/tq JSON yöntemi)
function fetchSheetData() {
    try {
        console.log('Veriler çekiliyor...');
        
        const query = new google.visualization.Query(
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?headers=1&range=A:E`
        );
        
        query.send(handleQueryResponse);
    } catch (error) {
        console.error('Google Sheets verisi çekilirken hata:', error);
    }
}

// Google Visualization API yanıtını işleme
function handleQueryResponse(response) {
    if (response.isError()) {
        console.error('Google Sheets Hatası:', response.getMessage() + ' ' + response.getDetailedMessage());
        return;
    }

    try {
        const data = response.getDataTable();
        console.log('Veriler başarıyla çekildi. Satır sayısı:', data.getNumberOfRows());

        // Veriyi işle ve kategori bazında gruplama yap
        const grouped = {};
        
        for (let i = 0; i < data.getNumberOfRows(); i++) {
            const kategori = (data.getValue(i, 0) || '').toLowerCase().trim();
            const ad = data.getValue(i, 1) || '';
            const aciklama = data.getValue(i, 2) || '';
            const fiyat = data.getValue(i, 3) || '';
            const gorsel = data.getValue(i, 4) || '';

            // Boş satırları atla
            if (!kategori || !ad) {
                console.warn('Boş veri satırı atlandı:', { kategori, ad });
                continue;
            }

            if (!grouped[kategori]) {
                grouped[kategori] = [];
            }

            grouped[kategori].push({
                ad,
                aciklama,
                fiyat,
                gorsel
            });

            console.log('Ürün eklendi:', { kategori, ad, fiyat });
        }

        console.log('Gruplandırılmış veriler:', grouped);
        
        // Veri varsa HTML'e enjekte et
        if (Object.keys(grouped).length > 0) {
            renderMenuItems(grouped);
        } else {
            console.warn('Hiç veri bulunamadı!');
        }
    } catch (error) {
        console.error('Veri işlenirken hata:', error);
    }
}

// Menü kartlarını HTML'e enjekte etme
function renderMenuItems(grouped) {
    const galleryContainer = document.querySelector('.tm-gallery');
    
    if (!galleryContainer) {
        console.error('Gallery container bulunamadı!');
        return;
    }

    // Mevcut kategoriler
    const categories = Object.keys(grouped).sort();
    console.log('Kategoriler:', categories);
    
    // Paging linklerini güncelle
    updatePagingLinks(categories);
    
    // Galerini temizle
    galleryContainer.innerHTML = '';
    
    // Her kategori için galeriye div oluştur
    categories.forEach((kategori, index) => {
        const items = grouped[kategori];
        const pageId = `tm-gallery-page-${kategori}`;
        
        // Yeni gallery page div oluştur
        const pageDiv = document.createElement('div');
        pageDiv.id = pageId;
        pageDiv.className = `tm-gallery-page ${index > 0 ? 'hidden' : ''}`;
        pageDiv.setAttribute('data-category', kategori);
        
        // Ürünleri HTML olarak render et
        items.forEach(item => {
            const article = document.createElement('article');
            article.className = 'col-lg-3 col-md-4 col-sm-6 col-12 tm-gallery-item';
            
            article.innerHTML = `
                <figure>
                    <img src="${escapeHtml(item.gorsel)}" alt="${escapeHtml(item.ad)}" class="img-fluid tm-gallery-img" />
                    <figcaption>
                        <h4 class="tm-gallery-title">${escapeHtml(item.ad)}</h4>
                        <p class="tm-gallery-description">${escapeHtml(item.aciklama)}</p>
                        <p class="tm-gallery-price">${escapeHtml(item.fiyat)}</p>
                    </figcaption>
                </figure>
            `;
            
            pageDiv.appendChild(article);
        });
        
        galleryContainer.appendChild(pageDiv);
        console.log(`${kategori} kategorisine ${items.length} ürün eklendi`);
    });
}

// Paging linklerini güncelle
function updatePagingLinks(categories) {
    const pagingNav = document.querySelector('.tm-paging-links nav ul');
    
    if (!pagingNav) {
        console.error('Paging navigation bulunamadı!');
        return;
    }
    
    pagingNav.innerHTML = '';
    
    categories.forEach((kategori, index) => {
        const li = document.createElement('li');
        li.className = 'tm-paging-item';
        
        const link = document.createElement('a');
        link.href = '#';
        link.className = `tm-paging-link ${index === 0 ? 'active' : ''}`;
        link.textContent = kategori.charAt(0).toUpperCase() + kategori.slice(1);
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.textContent.toLowerCase();
            console.log('Kategori seçildi:', page);
            
            // Tüm galeri sayfalarını gizle
            document.querySelectorAll('.tm-gallery-page').forEach(el => {
                el.classList.add('hidden');
            });
            
            // Seçilen sayfayı göster
            const targetPage = document.getElementById(`tm-gallery-page-${page}`);
            if (targetPage) {
                targetPage.classList.remove('hidden');
            }
            
            // Paging linklerinden active class'ını kaldır
            document.querySelectorAll('.tm-paging-link').forEach(el => {
                el.classList.remove('active');
            });
            
            // Seçilen linke active class'ını ekle
            this.classList.add('active');
        });
        
        li.appendChild(link);
        pagingNav.appendChild(li);
    });
    
    console.log('Paging linkler güncellendi');
}

// XSS koruması için HTML escape fonksiyonu
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Sayfa yüklendiğinde Google Visualization API'yi başlat
console.log('menu-loader.js yüklendi');

// Google Charts API'ni yükle ve callback'i ayarla
google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(function() {
    console.log('Google Charts API yüklendi');
    fetchSheetData();
});