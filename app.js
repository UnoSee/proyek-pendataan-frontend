document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3001';
    const menuItems = document.querySelectorAll('.menu-item');
    const contentTitle = document.getElementById('content-title');
    const dataContainer = document.getElementById('data-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const addNewBtn = document.querySelector('.add-new-btn');
    const searchInput = document.getElementById('search-input');
    const exportBtn = document.getElementById('export-btn');
    let activeMenuTarget = 'dashboard';
    let debounceTimer;

    const handleRowClick = (e) => {
        const row = e.target.closest('tr.clickable-row');
        if (!row) return;
        const type = row.dataset.type;
        const id = row.dataset.id;
        window.location.href = `edit.html?type=${type}&id=${encodeURIComponent(id)}`;
    };
    dataContainer.addEventListener('click', handleRowClick);

    const handleAddClick = () => {
        if (activeMenuTarget) window.location.href = `add.html?type=${activeMenuTarget}`;
    };
    addNewBtn.addEventListener('click', handleAddClick);

    const updateActionButtonsVisibility = (target) => {
        const creatableTypes = ['po', 'vendor', 'memo', 'invoice', 'client', 'kategori'];
        const searchableAndExportableTypes = ['po', 'vendor', 'memo', 'client', 'kategori', 'invoice'];

        addNewBtn.style.display = creatableTypes.includes(target) ? 'block' : 'none';
        exportBtn.style.display = searchableAndExportableTypes.includes(target) ? 'block' : 'none';
        searchInput.style.display = searchableAndExportableTypes.includes(target) ? 'block' : 'none';
    };

    const loadContent = async (target, searchTerm = '') => {
        showLoading();
        activeMenuTarget = target;
        updateActionButtonsVisibility(target);
        searchInput.value = searchTerm;
        let endpoint = target === 'dashboard'
            ? `${API_BASE_URL}/api/dashboard/stats`
            : `${API_BASE_URL}/api/${target}?search=${encodeURIComponent(searchTerm)}`;
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (renderers[target]) renderers[target](data);
        } catch (error) {
            dataContainer.innerHTML = `<p style="color: red;">Gagal memuat data: ${error.message}</p>`;
        } finally {
            hideLoading();
        }
    };
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            loadContent(activeMenuTarget, e.target.value);
        }, 500);
    });

    exportBtn.addEventListener('click', async () => {
        if (!activeMenuTarget) return;
        exportBtn.textContent = 'Mengekspor...';
        exportBtn.disabled = true;
        try {
            const response = await fetch(`${API_BASE_URL}/api/${activeMenuTarget}/export`);
            if (!response.ok) throw new Error('Gagal mengekspor data.');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            const disposition = response.headers.get('content-disposition');
            const filenameMatch = disposition && disposition.match(/filename="(.+?)"/);
            a.download = filenameMatch ? filenameMatch[1] : `${activeMenuTarget}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            alert(error.message);
        } finally {
            exportBtn.textContent = 'Export Excel';
            exportBtn.disabled = false;
        }
    });

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            menuItems.forEach(i => i.classList.remove('active'));
            const currentItem = e.currentTarget;
            currentItem.classList.add('active');
            const target = currentItem.dataset.target;
            contentTitle.textContent = currentItem.textContent;
            loadContent(target);
        });
    });
    
    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const showLoading = () => { dataContainer.innerHTML = ''; loadingIndicator.style.display = 'block'; };
    const hideLoading = () => { loadingIndicator.style.display = 'none'; };
    
    const renderDashboard = (stats) => {
        const dashboardHTML = `
           <div class="dashboard-grid">
               <div class="stat-card"><p class="stat-card-title">Total Purchase Orders</p><p class="stat-card-value">${stats.total_po}</p></div>
               <div class="stat-card"><p class="stat-card-title">Total Nilai Proyek</p><p class="stat-card-value">${formatCurrency(stats.total_value)}</p></div>
               <div class="stat-card"><p class="stat-card-title">Invoice Lunas</p><p class="stat-card-value">${stats.paid_invoices}</p></div>
               <div class="stat-card"><p class="stat-card-title">Invoice Tertunda</p><p class="stat-card-value">${stats.pending_invoices}</p></div>
           </div>
           <div class="recent-pos">
               <h4>Purchase Orders Terbaru</h4>
               <table><thead><tr><th>No. PO</th><th>Project</th><th>Vendor</th><th>Nominal</th></tr></thead>
               <tbody>${stats.recent_pos.map(po => `<tr><td>${po.no_po}</td><td>${po.perihal_project}</td><td>${po.nama_vendor}</td><td>${formatCurrency(po.nominal)}</td></tr>`).join('')}</tbody>
               </table>
           </div>`;
       dataContainer.innerHTML = dashboardHTML;
    };
   
    const renderTable = (headers, data, type, idField) => {
       const isClickable = ['po', 'vendor', 'memo', 'invoice', 'client', 'kategori'].includes(type);
       let tableHTML = `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
       data.forEach(item => {
           const rowClass = isClickable ? 'clickable-row' : '';
           const dataAttrs = isClickable ? `data-type="${type}" data-id="${item[idField]}"` : '';
           tableHTML += `<tr class="${rowClass}" ${dataAttrs}>`;
           if (type === 'po') tableHTML += `<td>${item.no_po}</td><td>${item.perihal_project}</td><td>${item.nama_vendor}</td><td>${formatCurrency(item.nominal)}</td><td><span class="status status-${item.status_po.toLowerCase().replace(' ', '-')}">${item.status_po}</span></td>`;
           else if (type === 'invoice') tableHTML += `<td>${item.no_invoice}</td><td>${item.no_po}</td><td>${formatCurrency(item.grand_total)}</td><td><span class="status status-${item.status_invoice.toLowerCase()}">${item.status_invoice}</span></td>`;
           else if (type === 'vendor') tableHTML += `<td>${item.nama_pt_cv}</td><td>${item.kategori_list || '-'}</td><td>${item.status_verifikasi}</td>`;
           else if (type === 'client') tableHTML += `<td>${item.id_client}</td><td>${item.nama_brand}</td><td>${item.nama_pt || '-'}</td>`;
           else if (type === 'kategori') tableHTML += `<td>${item.id_kategori}</td><td>${item.nama_kategori}</td>`;
           else if (type === 'memo') tableHTML += `<td>${item.no_memo}</td><td>${item.perihal}</td><td>${item.nama_brand}</td>`;
           tableHTML += `</tr>`;
       });
       tableHTML += `</tbody></table>`;
       dataContainer.innerHTML = tableHTML;
    };

    const renderers = {
       dashboard: renderDashboard,
       po: (data) => renderTable(['No. PO', 'Project', 'Vendor', 'Nominal', 'Status'], data, 'po', 'no_po'),
       invoice: (data) => renderTable(['No. Invoice', 'No. PO', 'Grand Total', 'Status'], data, 'invoice', 'id_invoice'),
       vendor: (data) => renderTable(['Nama PT/CV', 'Kategori', 'Status'], data, 'vendor', 'id_vendor'),
       client: (data) => renderTable(['ID', 'Nama Brand', 'Nama PT'], data, 'client', 'id_client'),
       kategori: (data) => renderTable(['ID', 'Nama Kategori'], data, 'kategori', 'id_kategori'),
       memo: (data) => renderTable(['No. Memo', 'Perihal', 'Client'], data, 'memo', 'no_memo'),
    };
    
    loadContent('dashboard');
});