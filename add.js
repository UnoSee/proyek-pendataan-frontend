// add.js (Final Lengkap)
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

    const buildAddForm = async () => {
        let formHTML = '';
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        addTitle.textContent = `Tambah ${title} Baru`;
        
        const attachmentHTML = `
            <div class="form-group">
                <label>Tambah Attachments</label>
                <input type="file" name="attachments" multiple>
            </div>`;

        switch (type) {
            case 'vendor':
                const categoriesRes = await fetch(`${API_BASE_URL}/api/kategori`);
                const categories = await categoriesRes.json();
                const categoryOptions = categories.map(cat => `<option value="${cat.id_kategori}">${cat.nama_kategori}</option>`).join('');

                formHTML = `
                    <div class="form-group"><label>Nama PT/CV</label><input type="text" name="nama_pt_cv" required></div>
                    <div class="form-group"><label>Nama Vendor (PIC)</label><input type="text" name="nama_vendor"></div>
                    <div class="form-group"><label>Kategori</label><select name="id_kategori">${categoryOptions}</select></div>
                    <div class="form-group"><label>Alamat</label><textarea name="alamat"></textarea></div>
                    <div class="form-group"><label>Status Verifikasi</label>
                        <select name="status_verifikasi"><option value="Belum terverifikasi">Belum terverifikasi</option><option value="Terverifikasi">Terverifikasi</option></select>
                    </div>
                    ${attachmentHTML}`;
                break;
            case 'po':
                const vendorsRes = await fetch(`${API_BASE_URL}/api/vendor`);
                const vendors = await vendorsRes.json();
                const vendorOptions = vendors.map(v => `<option value="${v.id_vendor}">${v.nama_pt_cv}</option>`).join('');

                const clientsResForPo = await fetch(`${API_BASE_URL}/api/client`);
                const clientsForPo = await clientsResForPo.json();
                const clientOptionsForPo = clientsForPo.map(c => `<option value="${c.id_client}">${c.nama_brand}</option>`).join('');

                formHTML = `
                    <div class="form-group"><label>No. PO</label><input type="text" name="no_po" required></div>
                    <div class="form-group"><label>Vendor</label><select name="id_vendor">${vendorOptions}</select></div>
                    <div class="form-group"><label>Client</label><select name="id_client">${clientOptionsForPo}</select></div>
                    <div class="form-group"><label>Tanggal PO</label><input type="date" name="tanggal_po" value="${new Date().toISOString().slice(0, 10)}" required></div>
                    <div class="form-group"><label>Nominal</label><input type="number" name="nominal" required></div>
                    <div class="form-group"><label>Perihal Project</label><textarea name="perihal_project" required></textarea></div>
                    <div class="form-group"><label>Status</label><select name="status_po"><option value="Belum Rilis">Belum Rilis</option><option value="Rilis">Rilis</option></select></div>
                    ${attachmentHTML}`;
                break;
            case 'memo':
                const clientsResForMemo = await fetch(`${API_BASE_URL}/api/client`);
                const clientsForMemo = await clientsResForMemo.json();
                const clientOptionsForMemo = clientsForMemo.map(c => `<option value="${c.id_client}">${c.nama_brand}</option>`).join('');
                
                formHTML = `
                    <div class="form-group"><label>No. Memo</label><input type="text" name="no_memo" required></div>
                    <div class="form-group"><label>Client</label><select name="id_client">${clientOptionsForMemo}</select></div>
                    <div class="form-group"><label>Perihal</label><textarea name="perihal" required></textarea></div>
                    ${attachmentHTML}`;
                break;
            case 'invoice':
                const poRes = await fetch(`${API_BASE_URL}/api/po`);
                const pos = await poRes.json();
                const poOptions = pos.map(p => `<option value="${p.no_po}">${p.no_po} - ${p.perihal_project}</option>`).join('');

                formHTML = `
                    <div class="form-group"><label>Nomor Invoice</label><input type="text" name="no_invoice" required></div>
                    <div class="form-group"><label>Purchase Order (PO)</label><select name="no_po">${poOptions}</select></div>
                    <div class="form-group"><label>Termin</label><input type="number" name="termin" value="1" required></div>
                    <div class="form-group"><label>Porsi Invoice (%)</label><input type="number" name="invoice_portion_percent" step="0.01" value="100.00" required></div>
                    <div class="form-group"><label>Status PPN</label>
                        <select name="ppn_status"><option value="PKP">PKP</option><option value="Non PKP">Non PKP</option></select>
                    </div>
                    <div class="form-group"><label>Status Invoice</label>
                        <select name="status_invoice"><option value="Unbill">Unbill</option><option value="Bill">Bill</option><option value="Paid">Paid</option></select>
                    </div>`;
                break;
            case 'client':
                formHTML = `
                    <div class="form-group"><label>Nama Brand</label><input type="text" name="nama_brand" required></div>
                    <div class="form-group"><label>Nama PT</label><input type="text" name="nama_pt"></div>
                    <div class="form-group"><label>Alamat</label><textarea name="alamat"></textarea></div>`;
                break;
            case 'kategori':
                formHTML = `<div class="form-group"><label>Nama Kategori</label><input type="text" name="nama_kategori" required></div>`;
                break;
        }
        addForm.innerHTML = formHTML + '<button type="submit" class="form-submit-btn">Simpan Data</button>';
    };

    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('.form-submit-btn');
        button.textContent = 'Menyimpan...';
        button.disabled = true;

        const formData = new FormData(addForm);
        try {
            const response = await fetch(`${API_BASE_URL}/api/${type}`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal menyimpan data.');
            }
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} berhasil dibuat!`);
            window.location.href = 'index.html';
        } catch (error) {
            alert(`Error: ${error.message}`);
            button.textContent = 'Simpan Data';
            button.disabled = false;
        }
    });

    buildAddForm().catch(err => addForm.innerHTML = `<p style="color:red">Gagal memuat form: ${err.message}</p>`);
});