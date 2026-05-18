// Google Sheets verilerini çekme ve HTML'e enjekte etme
const SHEET_ID = '1NFUc139dLSxxob2t59L9rOFKfdOK2UJ9Ck3omSQoGU4';
const SHEET_RANGE = 'A:E'; // kategori, ad, aciklama, fiyat, gorsel

// Google Sheets'ten veri çekme fonksiyonu (gviz/tq JSON yöntemi)
async function fetchSheetData() {
    try {
        const query = new window.google.visualization.Query(
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?headers=1`
        );
        
        query.send(handleQueryResponse);
    } catch (error) {
        console.error('Google Sheets verisi çekilirken hata:', error);
    }
}

// Google Visualization API yanıtını işleme
function handleQueryResponse(response) {
    if (response.isError()) {
        console.error('Hata:', response.getMessage() + ' ' + response.getDetailedMessage());
        return;
    }

    const data = response.getDataTable();
    const items = [];

    // Veriyi işle ve kategori bazında gruplama yap
    const grouped = {};
    
    for (let i = 0; i < data.getNumberOfRows(); i++) {
        const kategori = data.getValue(i, 0)?.toLowerCase() || '';
        const ad = data.getValue(i, 1) || '';
        const aciklama = data.getValue(i, 2) || '';
        const fiyat = data.getValue(i, 3) || '';
        const gorsel = data.getValue(i, 4) || '';

        if (!kategori || !ad) continue; // Boş satırları atla

        if (!grouped[kategori]) {
            grouped[kategori] = [];
        }

        grouped[kategori].push({
            ad,
            aciklama,
            fiyat,
            gorsel
        });
    }

    // HTML'e enjekte et
    renderMenuItems(grouped);
}

// Menü kartlarını HTML'e enjekte etme
function renderMenuItems(grouped) {
    const galleryContainer = document.querySelector('.tm-gallery');
    
    // Mevcut kategoriler
    const categories = Object.keys(grouped);
    
    // Paging linklerini güncelle
    updatePagingLinks(categories);
    
    // Her kategori için galeriye div oluştur
    Object.keys(grouped).forEach((kategori, index) => {
        const items = grouped[kategori];
        const pageId = `tm-gallery-page-${kategori}`;
        
        // Eğer sayfa zaten varsa, sil ve yeni oluştur
        const existingPage = document.getElementById(pageId);
        if (existingPage) {
            existingPage.remove();
        }
        
        // Yeni gallery page div oluştur
        const pageDiv = document.createElement('div');
        pageDiv.id = pageId;
        pageDiv.className = `tm-gallery-page ${index > 0 ? 'hidden' : ''}`;
        
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
    });
}

// Paging linklerini güncelle
function updatePagingLinks(categories) {
    const pagingNav = document.querySelector('.tm-paging-links nav ul');
    
    if (!pagingNav) return;
    
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
            document.querySelectorAll('.tm-gallery-page').forEach(el => {
                el.classList.add('hidden');
            });
            
            const targetPage = document.getElementById(`tm-gallery-page-${page}`);
            if (targetPage) {
                targetPage.classList.remove('hidden');
            }
            
            document.querySelectorAll('.tm-paging-link').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
        });
        
        li.appendChild(link);
        pagingNav.appendChild(li);
    });
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
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Sayfa yüklendiğinde veriyi çek
document.addEventListener('DOMContentLoaded', function() {
    // Google Visualization API'yi yükle ve veriyi çek
    google.setOnLoadCallback(fetchSheetData);
});