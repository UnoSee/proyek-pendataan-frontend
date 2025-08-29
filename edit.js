// edit.js (Final Lengkap)
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3001';
    const editTitle = document.getElementById('edit-title');
    const editForm = document.getElementById('edit-form');
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');

    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm('Apakah Anda yakin ingin menghapus attachment ini?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Gagal menghapus file.');
            document.getElementById(`attachment-${attachmentId}`).remove();
        } catch (error) {
            alert(error.message);
        }
    };

    editForm.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('attachment-delete-btn')) {
            const attachmentId = e.target.dataset.id;
            handleDeleteAttachment(attachmentId);
        }
    });
    
    const buildEditForm = async (data) => {
        let formHTML = '';
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        editTitle.textContent = `Edit ${title}: ${id}`;

        const attachmentHTML = (item) => {
            const fileList = (item.attachments && item.attachments.length > 0) 
                ? item.attachments.map(att => {
                    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(att.file_path);
                    return `
                        <li class="attachment-item" id="attachment-${att.id_attachment}">
                            <div class="attachment-preview">
                                ${isImage 
                                    ? `<img src="${API_BASE_URL}/uploads/${att.file_path}" alt="preview">` 
                                    : `<div class="attachment-preview-icon">📄</div>`
                                }
                            </div>
                            <div class="attachment-info">
                                <a href="${API_BASE_URL}/uploads/${att.file_path}" target="_blank">${att.file_path}</a>
                            </div>
                            <button type="button" class="attachment-delete-btn" data-id="${att.id_attachment}">&times;</button>
                        </li>`;
                }).join('')
                : '<li>Tidak ada attachment.</li>';
            
            return `
                <div class="form-group">
                    <label>Attachments Saat Ini</label>
                    <ul class="attachment-list">${fileList}</ul>
                </div>
                <div class="form-group">
                    <label>Tambah Attachment Baru</label>
                    <input type="file" name="attachments" multiple>
                </div>`;
        };

        switch (type) {
            case 'vendor':
                formHTML = `
                    <div class="form-group"><label>Nama PT/CV</label><input type="text" name="nama_pt_cv" value="${data.nama_pt_cv || ''}" required></div>
                    <div class="form-group"><label>Status Verifikasi</label>
                        <select name="status_verifikasi"><option value="Terverifikasi" ${data.status_verifikasi === 'Terverifikasi' ? 'selected' : ''}>Terverifikasi</option><option value="Belum terverifikasi" ${data.status_verifikasi === 'Belum terverifikasi' ? 'selected' : ''}>Belum terverifikasi</option></select>
                    </div>
                    ${attachmentHTML(data)}`;
                break;
            case 'po':
                 formHTML = `
                    <div class="form-group"><label>Perihal Project</label><textarea name="perihal_project" required>${data.perihal_project || ''}</textarea></div>
                    <div class="form-group"><label>Nominal</label><input type="number" name="nominal" value="${data.nominal || 0}" required></div>
                    <div class="form-group"><label>Status PO</label>
                        <select name="status_po"><option value="Rilis" ${data.status_po === 'Rilis' ? 'selected' : ''}>Rilis</option><option value="Belum Rilis" ${data.status_po === 'Belum Rilis' ? 'selected' : ''}>Belum Rilis</option></select>
                    </div>
                    ${attachmentHTML(data)}`;
                break;
            case 'memo':
                formHTML = `
                    <div class="form-group"><label>Perihal</label><textarea name="perihal" required>${data.perihal || ''}</textarea></div>
                    ${attachmentHTML(data)}`;
                break;
            case 'invoice':
                const poRes = await fetch(`${API_BASE_URL}/api/po`);
                const pos = await poRes.json();
                const poOptions = pos.map(p => `<option value="${p.no_po}" ${data.no_po === p.no_po ? 'selected' : ''}>${p.no_po} - ${p.perihal_project}</option>`).join('');

                formHTML = `
                    <div class="form-group"><label>Nomor Invoice</label><input type="text" name="no_invoice" value="${data.no_invoice || ''}" required></div>
                    <div class="form-group"><label>Purchase Order (PO)</label><select name="no_po">${poOptions}</select></div>
                    <div class="form-group"><label>Termin</label><input type="number" name="termin" value="${data.termin || ''}" required></div>
                    <div class="form-group"><label>Porsi Invoice (%)</label><input type="number" name="invoice_portion_percent" step="0.01" value="${data.invoice_portion_percent || ''}" required></div>
                    <div class="form-group"><label>Status PPN</label>
                        <select name="ppn_status">
                            <option value="PKP" ${data.ppn_status === 'PKP' ? 'selected' : ''}>PKP</option>
                            <option value="Non PKP" ${data.ppn_status === 'Non PKP' ? 'selected' : ''}>Non PKP</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Status Invoice</label>
                        <select name="status_invoice">
                            <option value="Unbill" ${data.status_invoice === 'Unbill' ? 'selected' : ''}>Unbill</option>
                            <option value="Bill" ${data.status_invoice === 'Bill' ? 'selected' : ''}>Bill</option>
                            <option value="Paid" ${data.status_invoice === 'Paid' ? 'selected' : ''}>Paid</option>
                        </select>
                    </div>`;
                break;
            case 'client':
                formHTML = `
                    <div class="form-group"><label>Nama Brand</label><input type="text" name="nama_brand" value="${data.nama_brand || ''}" required></div>
                    <div class="form-group"><label>Nama PT</label><input type="text" name="nama_pt" value="${data.nama_pt || ''}"></div>
                    <div class="form-group"><label>Alamat</label><textarea name="alamat">${data.alamat || ''}</textarea></div>`;
                break;
            case 'kategori':
                formHTML = `<div class="form-group"><label>Nama Kategori</label><input type="text" name="nama_kategori" value="${data.nama_kategori || ''}" required></div>`;
                break;
        }
        editForm.innerHTML = formHTML + '<button type="submit" class="form-submit-btn">Simpan Perubahan</button>';
    };

    const fetchData = async () => {
        try {
            const encodedId = encodeURIComponent(id);
            const response = await fetch(`${API_BASE_URL}/api/${type}/${encodedId}`);
            if (!response.ok) throw new Error('Data tidak ditemukan.');
            const data = await response.json();
            buildEditForm(data);
        } catch (error) {
            editTitle.textContent = 'Error';
            editForm.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    };

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('.form-submit-btn');
        button.textContent = 'Menyimpan...';
        button.disabled = true;
        
        try {
            const formData = new FormData(editForm);
            const response = await fetch(`${API_BASE_URL}/api/${type}/${encodeURIComponent(id)}`, {
                method: 'PUT', body: formData,
            });
            if (!response.ok) throw new Error('Gagal menyimpan data.');
            alert('Data berhasil diperbarui!');
            window.location.href = 'index.html';
        } catch (error) {
            alert(`Gagal menyimpan perubahan: ${error.message}`);
            button.textContent = 'Simpan Perubahan';
            button.disabled = false;
        }
    });

    fetchData();
});