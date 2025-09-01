// edit.js (Final dengan Perbaikan ReferenceError)
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
            
            // Reload data form untuk update tampilan
            fetchData();
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
                            <div class="attachment-info"><a href="${API_BASE_URL}/uploads/${att.file_path}" target="_blank">${att.file_path}</a></div>
                            <button type="button" class="attachment-delete-btn" data-id="${att.id_attachment}">&times;</button>
                        </li>`;
                }).join('') : '<li>Tidak ada attachment.</li>';
            return `<div class="form-group"><label>Attachments Saat Ini</label><ul class="attachment-list">${fileList}</ul></div><div class="form-group"><label>Tambah Attachment Baru</label><input type="file" name="attachments" multiple></div>`;
        };
        
        const docItems = [
            { key: 'npwp_file', label: 'NPWP', type: 'NPWP_FILE' },
            { key: 'ktp_direktur_file', label: 'KTP Direktur', type: 'KTP_DIREKTUR_FILE' },
            { key: 'surat_pernyataan_file', label: 'Surat Pernyataan', type: 'SURAT_PERNYATAAN_FILE' },
            { key: 'akte_file', label: 'Akte Perusahaan', type: 'AKTE_FILE' },
            { key: 'nib_file', label: 'NIB', type: 'NIB_FILE' },
        ];

        switch (type) {
            case 'vendor':
                const allCategoriesRes = await fetch(`${API_BASE_URL}/api/kategori`);
                const allCategories = await allCategoriesRes.json();
                const selectedCategoryIds = new Set(data.kategori_ids); 
                const categoryCheckboxes = allCategories.map(cat => `<div class="checkbox-item"><input type="checkbox" name="kategori_ids" value="${cat.id_kategori}" id="edit-cat-${cat.id_kategori}" ${selectedCategoryIds.has(cat.id_kategori) ? 'checked' : ''}><label for="edit-cat-${cat.id_kategori}">${cat.nama_kategori}</label></div>`).join('');

                const attachmentsByType = (data.attachments || []).reduce((acc, att) => {
                    acc[att.document_type] = att;
                    return acc;
                }, {});

                const docUploadHTML = docItems.map(doc => {
                    const attachment = attachmentsByType[doc.type];
                    const isUploaded = !!attachment;
                    return `
                        <div class="doc-upload-item" id="doc-item-${doc.key}">
                            <div class="doc-info">
                                <span class="status-icon">${isUploaded ? '✅' : '⚪'}</span>
                                <span class="doc-label">${doc.label}</span>
                            </div>
                            <div class="doc-actions">
                                ${isUploaded
                                    ? `<a href="${API_BASE_URL}/uploads/${attachment.file_path}" target="_blank">${attachment.file_path}</a>
                                       <button type="button" class="attachment-delete-btn" data-id="${attachment.id_attachment}">&times;</button>`
                                    : `<div class="file-input-wrapper">
                                           <button type="button" class="btn">Upload File</button>
                                           <input type="file" name="${doc.key}" onchange="this.previousElementSibling.textContent = 'File Dipilih'">
                                       </div>`
                                }
                            </div>
                        </div>
                    `;
                }).join('');

                formHTML = `
                    <div class="form-group"><label>Nama PT/CV</label><input type="text" name="nama_pt_cv" value="${data.nama_pt_cv || ''}" required></div>
                    <div class="form-group"><label>Nama Vendor (PIC)</label><input type="text" name="nama_vendor" value="${data.nama_vendor || ''}"></div>
                    <div class="form-group"><label>Nomor PIC</label><input type="text" name="nomor_pic" value="${data.nomor_pic || ''}"></div>
                    <div class="form-group"><label>Alamat</label><textarea name="alamat">${data.alamat || ''}</textarea></div>
                    <div class="form-group"><label>Kategori</label><div class="checkbox-group">${categoryCheckboxes}</div></div>
                    <div class="form-group"><label>Status Verifikasi</label><input type="text" value="${data.status_verifikasi}" readonly style="background-color:#e9ecef;"></div>
                    <fieldset class="verification-group">
                        <legend>Dokumen Wajib</legend>
                        <div class="doc-upload-list">${docUploadHTML}</div>
                    </fieldset>`;
                break;
            // ... case lain seperti po, memo, dll.
        }
        editForm.innerHTML = formHTML + '<button type="submit" class="form-submit-btn">Simpan Perubahan</button>';
    };

    const fetchData = async () => {
        try {
            const encodedId = encodeURIComponent(id);
            const response = await fetch(`${API_BASE_URL}/api/${type}/${encodedId}`);
            if (!response.ok) throw new Error('Data tidak ditemukan.');
            const data = await response.json();
            await buildEditForm(data);
        } catch (error) {
            editTitle.textContent = 'Error';
            editForm.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    };

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (confirm("Dengan menyimpan, Anda menyatakan bertanggung jawab atas keabsahan semua dokumen yang diunggah. Lanjutkan?")) {
            const button = e.target.querySelector('.form-submit-btn');
            button.textContent = 'Menyimpan...';
            button.disabled = true;
            
            try {
                const formData = new FormData(editForm);
                const response = await fetch(`${API_BASE_URL}/api/${type}/${encodeURIComponent(id)}`, { method: 'PUT', body: formData });
                if (!response.ok) throw new Error('Gagal menyimpan data.');
                alert('Data berhasil diperbarui!');
                window.location.href = 'index.html';
            } catch (error) {
                alert(`Gagal menyimpan perubahan: ${error.message}`);
                button.textContent = 'Simpan Perubahan';
                button.disabled = false;
            }
        }
    });

    fetchData();
});