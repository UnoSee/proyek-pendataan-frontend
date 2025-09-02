document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3001';
    const addTitle = document.getElementById('add-title');
    const addForm = document.getElementById('add-form');
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');

    if (!type) {
        addTitle.textContent = 'Error: Tipe data tidak ditemukan';
        return;
    }

    // --- Helper untuk Kalkulasi Invoice ---
    const calculateInvoice = () => {
        const nominalPoEl = document.getElementById('nominal-po');
        const porsiTerminEl = document.getElementById('porsi-termin');
        const statusPpnEl = document.getElementById('status-ppn');

        const dppEl = document.getElementById('display-dpp');
        const ppnEl = document.getElementById('display-ppn');
        const pphEl = document.getElementById('display-pph');
        const grandTotalEl = document.getElementById('display-grand-total');

        if (!nominalPoEl || !porsiTerminEl || !statusPpnEl) return;

        const nominalPO = parseFloat(nominalPoEl.value) || 0;
        const porsiTermin = parseFloat(porsiTerminEl.value) || 0;
        const isPKP = statusPpnEl.value === 'PKP';

        const dpp = nominalPO * (porsiTermin / 100);
        const ppn = isPKP ? dpp * 0.11 : 0;
        const pph = dpp * 0.02;
        const grandTotal = (dpp + ppn) - pph;

        const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

        dppEl.textContent = formatCurrency(dpp);
        ppnEl.textContent = formatCurrency(ppn);
        pphEl.textContent = formatCurrency(pph);
        grandTotalEl.textContent = formatCurrency(grandTotal);
    };

    const buildAddForm = async () => {
        let formHTML = '';
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        addTitle.textContent = `Tambah ${title} Baru`;
        
        const attachmentHTML = `<div class="form-group"><label>Tambah Attachments (Umum)</label><input type="file" name="attachments" multiple></div>`;

        try {
            switch (type) {
                case 'project':
                    formHTML = `
                        <div class="form-group"><label>Nama Project</label><input type="text" name="nama_project" required></div>
                        <div class="form-group"><label>Kategori Project</label><input type="text" name="kategori_project"></div>`;
                    break;
                case 'kategori':
                    formHTML = `<div class="form-group"><label>Nama Kategori</label><input type="text" name="nama_kategori" required></div>`;
                    break;
                case 'client':
                    formHTML = `
                        <div class="form-group"><label>Nama Brand</label><input type="text" name="nama_brand" required></div>
                        <div class="form-group"><label>Nama PT</label><input type="text" name="nama_pt"></div>
                        <div class="form-group"><label>Alamat</label><textarea name="alamat"></textarea></div>`;
                    break;
                case 'vendor':
                    const categoriesRes = await fetch(`${API_BASE_URL}/api/kategori`);
                    const categories = await categoriesRes.json();
                    const categoryCheckboxes = categories.map(cat => `<div class="checkbox-item"><input type="checkbox" name="kategori_ids" value="${cat.id_kategori}" id="cat-${cat.id_kategori}"><label for="cat-${cat.id_kategori}">${cat.nama_kategori}</label></div>`).join('');
                    const docItems = [
                        { key: 'npwp_file', label: 'NPWP' }, { key: 'ktp_direktur_file', label: 'KTP Direktur' },
                        { key: 'surat_pernyataan_file', label: 'Surat Pernyataan' }, { key: 'akte_file', label: 'Akte Perusahaan' },
                        { key: 'nib_file', label: 'NIB' },
                    ];
                    const docUploadHTML = docItems.map(doc => `
                        <div class="doc-upload-item">
                            <div class="doc-info"><span class="status-icon">⚪</span><span class="doc-label">${doc.label}</span></div>
                            <div class="doc-actions"><div class="file-input-wrapper"><button type="button" class="btn">Upload File</button><input type="file" name="${doc.key}" onchange="this.previousElementSibling.textContent = 'File Dipilih'"></div></div>
                        </div>`).join('');
                    formHTML = `
                        <div class="form-group"><label>Nama PT/CV</label><input type="text" name="nama_pt_cv" required></div>
                        <div class="form-group"><label>Nama Vendor (PIC)</label><input type="text" name="nama_vendor"></div>
                        <div class="form-group"><label>Nomor PIC</label><input type="text" name="nomor_pic"></div>
                        <div class="form-group"><label>Alamat</label><textarea name="alamat"></textarea></div>
                        <div class="form-group"><label>Kategori</label><div class="checkbox-group">${categoryCheckboxes}</div></div>
                        <fieldset class="verification-group"><legend>Dokumen Wajib</legend><div class="doc-upload-list">${docUploadHTML}</div></fieldset>`;
                    break;
                case 'memo':
                    const clientsRes = await fetch(`${API_BASE_URL}/api/client`);
                    const clients = await clientsRes.json();
                    const clientOptions = clients.map(c => `<option value="${c.id_client}">${c.nama_brand}</option>`).join('');
                    const projectsRes = await fetch(`${API_BASE_URL}/api/project`);
                    const projects = await projectsRes.json();
                    const projectOptions = projects.map(p => `<option value="${p.id_project}">${p.nama_project}</option>`).join('');
                    formHTML = `
                        <div class="form-group"><label>No. Memo</label><input type="text" name="no_memo" required></div>
                        <div class="form-group"><label>Client</label><select name="id_client" required><option value="">- Pilih Client -</option>${clientOptions}</select></div>
                        <div class="form-group"><label>Project</label><select name="id_project" required><option value="">- Pilih Project -</option>${projectOptions}</select></div>
                        <div class="form-group"><label>User Internal</label><input type="text" name="user_internal" required></div>
                        <div class="form-group"><label>Perihal</label><textarea name="perihal" required></textarea></div>
                        ${attachmentHTML}`;
                    break;
                case 'po':
                    const vendorsRes = await fetch(`${API_BASE_URL}/api/vendor`);
                    const vendors = await vendorsRes.json();
                    const vendorOptions = vendors.map(v => `<option value="${v.id_vendor}">${v.nama_pt_cv}</option>`).join('');
                    const poClientsRes = await fetch(`${API_BASE_URL}/api/client`);
                    const poClients = await poClientsRes.json();
                    const poClientOptions = poClients.map(c => `<option value="${c.id_client}">${c.nama_brand}</option>`).join('');
                    const poProjectsRes = await fetch(`${API_BASE_URL}/api/project`);
                    const poProjects = await poProjectsRes.json();
                    const poProjectOptions = poProjects.map(p => `<option value="${p.id_project}">${p.nama_project}</option>`).join('');
                    const memosRes = await fetch(`${API_BASE_URL}/api/memo`);
                    const memos = await memosRes.json();
                    const memoOptions = memos.map(m => `<option value="${m.no_memo}" data-user="${m.user_internal || ''}">${m.no_memo} - ${m.perihal}</option>`).join('');
                    formHTML = `
                        <div class="form-group"><label>No. PO</label><input type="text" name="no_po" required></div>
                        <div class="form-group"><label>Nama Vendor</label><select name="id_vendor" required><option value="">- Pilih Vendor -</option>${vendorOptions}</select></div>
                        <div class="form-group"><label>Project</label><select name="id_project" required><option value="">- Pilih Project -</option>${poProjectOptions}</select></div>
                        <div class="form-group"><label>Nama Client</label><select name="id_client" required><option value="">- Pilih Client -</option>${poClientOptions}</select></div>
                        <div class="form-group"><label>Memo</label><select id="memo-select" name="no_memo" required><option value="">- Pilih Memo -</option>${memoOptions}</select></div>
                        <div class="form-group"><label>User Internal</label><input type="text" id="user-internal-input" name="user_internal" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Tanggal PO</label><input type="date" name="tanggal_po" value="${new Date().toISOString().slice(0, 10)}" required></div>
                         <div class="form-group"><label>Nominal</label><input type="number" name="nominal" required></div>
                        <div class="form-group"><label>Perihal Project</label><textarea name="perihal_project" required></textarea></div>
                        <fieldset class="verification-group">
                            <legend>Upload Dokumen PO</legend>
                            <div class="form-group"><label>Dokumen PO</label><input type="file" name="dokumen_po"></div>
                            <div class="form-group"><label>PCP / RAB</label><input type="file" name="pcp_rab"></div>
                            <div class="form-group"><label>FPB</label><input type="file" name="fpb"></div>
                            <div class="form-group"><label>SPH Vendor</label><input type="file" name="sph_vendor"></div>
                        </fieldset>`;
                    break;
                case 'invoice':
                    const poRes = await fetch(`${API_BASE_URL}/api/po`);
                    const pos = await poRes.json();
                    const poOptions = pos.map(p => `<option value="${p.no_po}">${p.no_po} - ${p.perihal_project || 'Tanpa Perihal'}</option>`).join('');
                    formHTML = `
                        <div class="form-group"><label>Pilih Purchase Order (PO)</label><select id="po-select" name="no_po" required><option value="">- Pilih PO -</option>${poOptions}</select></div>
                        <hr style="margin: 2rem 0;">
                        <h3>Detail Invoice</h3>
                        <div class="form-group"><label>Nomor Invoice</label><input type="text" name="no_invoice" required></div>
                        <div class="form-group"><label>Nama Vendor</label><input type="text" id="nama-vendor" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Nama Client</label><input type="text" id="nama-client" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Project</label><input type="text" id="nama-project" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Nominal PO</label><input type="text" id="nominal-po" readonly style="background-color:#e9ecef;"></div>
                        
                        <fieldset class="verification-group"><legend>Attachment dari PO</legend><div id="po-attachments-list">Pilih PO untuk melihat attachment.</div></fieldset>

                        <hr style="margin: 2rem 0;">
                        <h3>Detail Pembayaran</h3>
                        <div class="form-group"><label>Termin</label><input type="number" name="termin" value="1" required></div>
                        <div class="form-group"><label>Porsi Termin (%)</label><input type="number" id="porsi-termin" name="invoice_portion_percent" step="0.01" value="100.00" required></div>
                        <div class="form-group"><label>Status PPN</label><select id="status-ppn" name="ppn_status"><option value="PKP">PKP</option><option value="Non PKP">Non PKP</option></select></div>
                        <div class="form-group"><label>Status Invoice</label><select name="status_invoice"><option value="Draft">Draft</option><option value="Submitted">Submitted</option><option value="Paid">Paid</option></select></div>
                        
                        <fieldset class="verification-group"><legend>Kalkulasi Otomatis</legend>
                            <p>DPP: <strong id="display-dpp">Rp 0</strong></p>
                            <p>PPN (11%): <strong id="display-ppn">Rp 0</strong></p>
                            <p>PPh (2%): <strong id="display-pph">Rp 0</strong></p>
                            <hr><p>Grand Total: <strong id="display-grand-total">Rp 0</strong></p>
                        </fieldset>`;
                    break;
            }
            addForm.innerHTML = formHTML + '<button type="submit" class="form-submit-btn">Simpan Data</button>';
            
            // Event Listeners setelah form dibuat
            if (type === 'po') {
                document.getElementById('memo-select')?.addEventListener('change', (e) => {
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    document.getElementById('user-internal-input').value = selectedOption.dataset.user || '';
                });
            }
            if (type === 'invoice') {
                document.getElementById('po-select')?.addEventListener('change', async (e) => {
                    const poId = e.target.value;
                    if (!poId) return;
                    const response = await fetch(`${API_BASE_URL}/api/po/${encodeURIComponent(poId)}`);
                    const poData = await response.json();
                    document.getElementById('nama-vendor').value = poData.nama_vendor || '';
                    document.getElementById('nama-client').value = poData.nama_client || '';
                    document.getElementById('nama-project').value = poData.nama_project || '';
                    document.getElementById('nominal-po').value = poData.nominal || 0;
                    
                    const attachmentPaths = [
                        { label: 'Dokumen PO', path: poData.path_dokumen_po }, { label: 'Memo User', path: poData.path_memo_user },
                        { label: 'PCP / RAB', path: poData.path_pcp_rab }, { label: 'FPB', path: poData.path_fpb },
                        { label: 'SPH Vendor', path: poData.path_sph_vendor }
                    ];
                    const attachmentList = document.getElementById('po-attachments-list');
                    attachmentList.innerHTML = attachmentPaths
                        .filter(att => att.path)
                        .map(att => `<p><strong>${att.label}:</strong> <a href="${API_BASE_URL}/${att.path}" target="_blank">${att.path}</a></p>`)
                        .join('') || 'Tidak ada attachment di PO ini.';

                    calculateInvoice();
                });
                document.getElementById('porsi-termin')?.addEventListener('input', calculateInvoice);
                document.getElementById('status-ppn')?.addEventListener('change', calculateInvoice);
            }

        } catch (err) {
            addForm.innerHTML = `<p style="color:red">Gagal memuat form: ${err.message}</p>`;
        }
    };

    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin menyimpan data baru ini?")) {
            const button = e.target.querySelector('.form-submit-btn');
            button.textContent = 'Menyimpan...';
            button.disabled = true;
            const formData = new FormData(addForm);
            try {
                const response = await fetch(`${API_BASE_URL}/api/${type}`, { method: 'POST', body: formData });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Gagal menyimpan data.');
                }
                const newRecord = await response.json();
                alert(`${title} berhasil dibuat!`);
                window.location.href = `index.html?view=${type}`;
            } catch (error) {
                alert(`Error: ${error.message}`);
                button.textContent = 'Simpan Data';
                button.disabled = false;
            }
        }
    });

    buildAddForm();
});