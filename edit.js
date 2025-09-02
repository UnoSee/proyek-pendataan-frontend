document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3001';
    const editTitle = document.getElementById('edit-title');
    const editForm = document.getElementById('edit-form');
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');

    if (!type || !id) {
        editTitle.textContent = 'Error: Data tidak ditemukan';
        return;
    }

    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    const calculateInvoice = () => {
        const nominalPoEl = document.getElementById('nominal-po');
        const porsiTerminEl = document.getElementById('porsi-termin');
        const statusPpnEl = document.getElementById('status-ppn');
        if (!nominalPoEl || !porsiTerminEl || !statusPpnEl) return;

        const nominalPO = parseFloat(nominalPoEl.value) || 0;
        const porsiTermin = parseFloat(porsiTerminEl.value) || 0;
        const isPKP = statusPpnEl.value === 'PKP';

        const dpp = nominalPO * (porsiTermin / 100);
        const ppn = isPKP ? dpp * 0.11 : 0;
        const pph = dpp * 0.02;
        const grandTotal = (dpp + ppn) - pph;

        document.getElementById('display-dpp').textContent = formatCurrency(dpp);
        document.getElementById('display-ppn').textContent = formatCurrency(ppn);
        document.getElementById('display-pph').textContent = formatCurrency(pph);
        document.getElementById('display-grand-total').textContent = formatCurrency(grandTotal);
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm('Apakah Anda yakin ingin menghapus attachment ini?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Gagal menghapus file.');
            fetchData(); // Muat ulang data form untuk update tampilan
        } catch (error) {
            alert(error.message);
        }
    };
    editForm.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('attachment-delete-btn')) {
            handleDeleteAttachment(e.target.dataset.id);
        }
    });

    const buildEditForm = async (data) => {
        let formHTML = '';
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        editTitle.textContent = `Edit ${title}: ${id}`;
        
        try {
            switch (type) {
                case 'project':
                    formHTML = `
                        <div class="form-group"><label>Nama Project</label><input type="text" name="nama_project" value="${data.nama_project || ''}" required></div>
                        <div class="form-group"><label>Kategori Project</label><input type="text" name="kategori_project" value="${data.kategori_project || ''}"></div>`;
                    break;
                case 'kategori':
                    formHTML = `<div class="form-group"><label>Nama Kategori</label><input type="text" name="nama_kategori" value="${data.nama_kategori || ''}" required></div>`;
                    break;
                case 'client':
                    formHTML = `
                        <div class="form-group"><label>Nama Brand</label><input type="text" name="nama_brand" value="${data.nama_brand || ''}" required></div>
                        <div class="form-group"><label>Nama PT</label><input type="text" name="nama_pt" value="${data.nama_pt || ''}"></div>
                        <div class="form-group"><label>Alamat</label><textarea name="alamat">${data.alamat || ''}</textarea></div>`;
                    break;
                case 'vendor':
                    const allCategoriesRes = await fetch(`${API_BASE_URL}/api/kategori`);
                    const allCategories = await allCategoriesRes.json();
                    const selectedCategoryIds = new Set(data.kategori_ids);
                    const categoryCheckboxes = allCategories.map(cat => `<div class="checkbox-item"><input type="checkbox" name="kategori_ids" value="${cat.id_kategori}" id="edit-cat-${cat.id_kategori}" ${selectedCategoryIds.has(cat.id_kategori) ? 'checked' : ''}><label for="edit-cat-${cat.id_kategori}">${cat.nama_kategori}</label></div>`).join('');
                    const docItems = [
                        { key: 'npwp_file', label: 'NPWP', type: 'NPWP_FILE' }, { key: 'ktp_direktur_file', label: 'KTP Direktur', type: 'KTP_DIREKTUR_FILE' },
                        { key: 'surat_pernyataan_file', label: 'Surat Pernyataan', type: 'SURAT_PERNYATAAN_FILE' }, { key: 'akte_file', label: 'Akte Perusahaan', type: 'AKTE_FILE' },
                        { key: 'nib_file', label: 'NIB', type: 'NIB_FILE' },
                    ];
                    const attachmentsByType = (data.attachments || []).reduce((acc, att) => { acc[att.document_type] = att; return acc; }, {});
                    const docUploadHTML = docItems.map(doc => {
                        const attachment = attachmentsByType[doc.type];
                        const isUploaded = !!attachment;
                        return `
                            <div class="doc-upload-item" id="doc-item-${doc.key}">
                                <div class="doc-info"><span class="status-icon">${isUploaded ? '✅' : '⚪'}</span><span class="doc-label">${doc.label}</span></div>
                                <div class="doc-actions">
                                    ${isUploaded
                                        ? `<a href="${API_BASE_URL}/uploads/${attachment.file_path}" target="_blank">${attachment.file_path}</a><button type="button" class="attachment-delete-btn" data-id="${attachment.id_attachment}">&times;</button>`
                                        : `<div class="file-input-wrapper"><button type="button" class="btn">Upload File</button><input type="file" name="${doc.key}" onchange="this.previousElementSibling.textContent = 'File Dipilih'"></div>`
                                    }
                                </div>
                            </div>`;
                    }).join('');
                    formHTML = `
                        <div class="form-group"><label>Nama PT/CV</label><input type="text" name="nama_pt_cv" value="${data.nama_pt_cv || ''}" required></div>
                        <div class="form-group"><label>Nama Vendor (PIC)</label><input type="text" name="nama_vendor" value="${data.nama_vendor || ''}"></div>
                        <div class="form-group"><label>Nomor PIC</label><input type="text" name="nomor_pic" value="${data.nomor_pic || ''}"></div>
                        <div class="form-group"><label>Alamat</label><textarea name="alamat">${data.alamat || ''}</textarea></div>
                        <div class="form-group"><label>Kategori</label><div class="checkbox-group">${categoryCheckboxes}</div></div>
                        <div class="form-group"><label>Status Verifikasi</label><input type="text" value="${data.status_verifikasi}" readonly style="background-color:#e9ecef;"></div>
                        <fieldset class="verification-group"><legend>Dokumen Wajib</legend><div class="doc-upload-list">${docUploadHTML}</div></fieldset>`;
                    break;
                case 'memo':
                    const clientsRes = await fetch(`${API_BASE_URL}/api/client`);
                    const clients = await clientsRes.json();
                    const clientOptions = clients.map(c => `<option value="${c.id_client}" ${data.id_client === c.id_client ? 'selected' : ''}>${c.nama_brand}</option>`).join('');
                    const projectsRes = await fetch(`${API_BASE_URL}/api/project`);
                    const projects = await projectsRes.json();
                    const projectOptions = projects.map(p => `<option value="${p.id_project}" ${data.id_project === p.id_project ? 'selected' : ''}>${p.nama_project}</option>`).join('');
                    const attachmentHTML = (item) => {
                        const fileList = (item.attachments && item.attachments.length > 0) 
                            ? item.attachments.map(att => `<li class="attachment-item" id="attachment-${att.id_attachment}"><div class="attachment-preview"><div class="attachment-preview-icon">📄</div></div><div class="attachment-info"><a href="${API_BASE_URL}/uploads/${att.file_path}" target="_blank">${att.file_path}</a></div><button type="button" class="attachment-delete-btn" data-id="${att.id_attachment}">&times;</button></li>`).join('') 
                            : '<li>Tidak ada attachment.</li>';
                        return `<div class="form-group"><label>Attachments Saat Ini</label><ul class="attachment-list">${fileList}</ul></div><div class="form-group"><label>Tambah Attachment Baru</label><input type="file" name="attachments" multiple></div>`;
                    };
                    formHTML = `
                        <div class="form-group"><label>No. Memo</label><input type="text" name="no_memo" value="${data.no_memo}" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Client</label><select name="id_client" required>${clientOptions}</select></div>
                        <div class="form-group"><label>Project</label><select name="id_project" required>${projectOptions}</select></div>
                        <div class="form-group"><label>User Internal</label><input type="text" name="user_internal" value="${data.user_internal || ''}" required></div>
                        <div class="form-group"><label>Perihal</label><textarea name="perihal" required>${data.perihal || ''}</textarea></div>
                        ${attachmentHTML(data)}`;
                    break;
                case 'po':
                    const [vendorsRes, poClientsRes, poProjectsRes, memosRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/api/vendor`), fetch(`${API_BASE_URL}/api/client`),
                        fetch(`${API_BASE_URL}/api/project`), fetch(`${API_BASE_URL}/api/memo`)
                    ]);
                    const vendors = await vendorsRes.json();
                    const poClients = await poClientsRes.json();
                    const poProjects = await poProjectsRes.json();
                    const memos = await memosRes.json();
                    const vendorOptions = vendors.map(v => `<option value="${v.id_vendor}" ${data.id_vendor === v.id_vendor ? 'selected' : ''}>${v.nama_pt_cv}</option>`).join('');
                    const poClientOptions = poClients.map(c => `<option value="${c.id_client}" ${data.id_client === c.id_client ? 'selected' : ''}>${c.nama_brand}</option>`).join('');
                    const poProjectOptions = poProjects.map(p => `<option value="${p.id_project}" ${data.id_project === p.id_project ? 'selected' : ''}>${p.nama_project}</option>`).join('');
                    const memoOptions = memos.map(m => `<option value="${m.no_memo}" data-user="${m.user_internal || ''}" ${data.no_memo === m.no_memo ? 'selected' : ''}>${m.no_memo} - ${m.perihal}</option>`).join('');
                    const poAttachmentHTML = (fieldName, label, path) => `
                        <div class="form-group"><label>${label}</label>
                        ${path ? `<p><a href="${API_BASE_URL}/${path}" target="_blank">${path.split(/[\\/]/).pop()}</a></p>` : '<p class="text-muted">Belum diunggah.</p>'}
                        <input type="file" name="${fieldName}">
                        <input type="hidden" name="existing_${fieldName}" value="${path || ''}"></div>`;
                    formHTML = `
                        <div class="form-group"><label>No. PO</label><input type="text" name="no_po" value="${data.no_po}" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Nama Vendor</label><select name="id_vendor" required>${vendorOptions}</select></div>
                        <div class="form-group"><label>Project</label><select name="id_project" required>${poProjectOptions}</select></div>
                        <div class="form-group"><label>Nama Client</label><select name="id_client" required>${poClientOptions}</select></div>
                        <div class="form-group"><label>Memo</label><select id="memo-select" name="no_memo" required>${memoOptions}</select></div>
                        <div class="form-group"><label>User Internal</label><input type="text" id="user-internal-input" name="user_internal" value="${data.user_internal || ''}" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Tanggal PO</label><input type="date" name="tanggal_po" value="${new Date(data.tanggal_po).toISOString().slice(0, 10)}" required></div>
                        <div class="form-group"><label>Nominal</label><input type="number" name="nominal" value="${data.nominal || 0}" required></div>
                        <div class="form-group"><label>Perihal Project</label><textarea name="perihal_project" required>${data.perihal_project || ''}</textarea></div>
                        <fieldset class="verification-group">
                            <legend>Dokumen PO</legend>
                            ${poAttachmentHTML('dokumen_po', 'Dokumen PO', data.path_dokumen_po)}
                            <div class="form-group"><label>Memo User (dari Memo)</label>${data.path_memo_user ? `<p><a href="${API_BASE_URL}/uploads/${data.path_memo_user}" target="_blank">${data.path_memo_user}</a></p>` : 'Memo belum dipilih / tidak ada attachment.'}</div>
                            ${poAttachmentHTML('pcp_rab', 'PCP / RAB', data.path_pcp_rab)}
                            ${poAttachmentHTML('fpb', 'FPB', data.path_fpb)}
                            ${poAttachmentHTML('sph_vendor', 'SPH Vendor', data.path_sph_vendor)}
                        </fieldset>`;
                    break;
                case 'invoice':
                    const poRes = await fetch(`${API_BASE_URL}/api/po`);
                    const pos = await poRes.json();
                    const poOptions = pos.map(p => `<option value="${p.no_po}" ${data.no_po === p.no_po ? 'selected' : ''}>${p.no_po} - ${p.perihal_project || 'Tanpa Perihal'}</option>`).join('');
                    const poDetailRes = await fetch(`${API_BASE_URL}/api/po/${encodeURIComponent(data.no_po)}`);
                    const poDetail = await poDetailRes.json();
                    const attachmentPaths = [
                        { label: 'Dokumen PO', path: poDetail.path_dokumen_po }, { label: 'Memo User', path: poDetail.path_memo_user },
                        { label: 'PCP / RAB', path: poDetail.path_pcp_rab }, { label: 'FPB', path: poDetail.path_fpb },
                        { label: 'SPH Vendor', path: poDetail.path_sph_vendor }
                    ];
                    const poAttachmentList = attachmentPaths
                        .filter(att => att.path)
                        .map(att => `<p><strong>${att.label}:</strong> <a href="${API_BASE_URL}/${att.path}" target="_blank">${att.path}</a></p>`)
                        .join('') || 'Tidak ada attachment di PO ini.';

                    formHTML = `
                        <div class="form-group"><label>Purchase Order (PO)</label><select id="po-select" name="no_po" required>${poOptions}</select></div><hr style="margin: 2rem 0;">
                        <h3>Detail Invoice</h3>
                        <div class="form-group"><label>Nomor Invoice</label><input type="text" name="no_invoice" value="${data.no_invoice || ''}" required></div>
                        <div class="form-group"><label>Nama Vendor</label><input type="text" id="nama-vendor" value="${poDetail.nama_vendor || ''}" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Nama Client</label><input type="text" id="nama-client" value="${poDetail.nama_client || ''}" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Project</label><input type="text" id="nama-project" value="${poDetail.nama_project || ''}" readonly style="background-color:#e9ecef;"></div>
                        <div class="form-group"><label>Nominal PO</label><input type="number" id="nominal-po" value="${poDetail.nominal || 0}" readonly style="background-color:#e9ecef;"></div>
                        <fieldset class="verification-group"><legend>Attachment dari PO</legend><div id="po-attachments-list">${poAttachmentList}</div></fieldset><hr style="margin: 2rem 0;">
                        <h3>Detail Pembayaran</h3>
                        <div class="form-group"><label>Termin</label><input type="number" name="termin" value="${data.termin || '1'}" required></div>
                        <div class="form-group"><label>Porsi Termin (%)</label><input type="number" id="porsi-termin" name="invoice_portion_percent" step="0.01" value="${data.invoice_portion_percent || '100'}" required></div>
                        <div class="form-group"><label>Status PPN</label><select id="status-ppn" name="ppn_status"><option value="PKP" ${data.ppn_status === 'PKP' ? 'selected' : ''}>PKP</option><option value="Non PKP" ${data.ppn_status === 'Non PKP' ? 'selected' : ''}>Non PKP</option></select></div>
                        <div class="form-group"><label>Status Invoice</label><select name="status_invoice"><option value="Draft" ${data.status_invoice === 'Draft' ? 'selected' : ''}>Draft</option><option value="Submitted" ${data.status_invoice === 'Submitted' ? 'selected' : ''}>Submitted</option><option value="Paid" ${data.status_invoice === 'Paid' ? 'selected' : ''}>Paid</option></select></div>
                        <fieldset class="verification-group"><legend>Kalkulasi Otomatis</legend>
                            <p>DPP: <strong id="display-dpp">Rp 0</strong></p><p>PPN (11%): <strong id="display-ppn">Rp 0</strong></p>
                            <p>PPh (2%): <strong id="display-pph">Rp 0</strong></p><hr><p>Grand Total: <strong id="display-grand-total">Rp 0</strong></p>
                        </fieldset>`;
                    break;
            }
            editForm.innerHTML = formHTML + '<button type="submit" class="form-submit-btn">Simpan Perubahan</button>';
            
            // Event Listeners setelah form dibuat
            if (type === 'invoice') {
                calculateInvoice(); // Kalkulasi awal saat load
                document.getElementById('porsi-termin')?.addEventListener('input', calculateInvoice);
                document.getElementById('status-ppn')?.addEventListener('change', calculateInvoice);
            }
            if (type === 'po') {
                document.getElementById('memo-select')?.addEventListener('change', (e) => {
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    document.getElementById('user-internal-input').value = selectedOption.dataset.user || '';
                });
            }

        } catch (err) {
            editForm.innerHTML = `<p style="color:red">Gagal memuat form: ${err.message}</p>`;
        }
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
        const confirmMsg = (type === 'vendor')
            ? "Dengan menyimpan, Anda menyatakan bertanggung jawab atas keabsahan semua dokumen yang diunggah. Lanjutkan?"
            : "Anda yakin ingin menyimpan perubahan ini?";

        if (confirm(confirmMsg)) {
            const button = e.target.querySelector('.form-submit-btn');
            button.textContent = 'Menyimpan...';
            button.disabled = true;
            try {
                const formData = new FormData(editForm);
                const response = await fetch(`${API_BASE_URL}/api/${type}/${encodeURIComponent(id)}`, { method: 'PUT', body: formData });
                if (!response.ok) throw new Error('Gagal menyimpan data.');
                alert('Data berhasil diperbarui!');
                window.location.href = `index.html?view=${type}`;
            } catch (error) {
                alert(`Gagal menyimpan perubahan: ${error.message}`);
                button.textContent = 'Simpan Perubahan';
                button.disabled = false;
            }
        }
    });

    fetchData();
});