console.log("Script loaded ontvangstloket");

const inputSelectionLeverancier = document.getElementById("inputSelectionLeverancier");
const inputSelectionFile = document.getElementById("excelFile_req");


// Holds the latest response payload so other handlers (e.g. Verzenden) can use it
let currentResponseData = null;


function handleFormSubmit(event) {
    event.preventDefault();

    const selectedLeverancier = inputSelectionLeverancier.value;
    const selectedFile = inputSelectionFile.files[0];
    const inputFile = inputSelectionFile.files;
    const selectedFileName = inputSelectionFile.files[0] ? inputSelectionFile.files[0].name : "No file selected";
    const inputFileName = document.getElementById("sourceFileName");
    let isValid = true
   
    if(selectedLeverancier) {
    document.getElementById('LabelLeverancier').classList.remove('c_red');
    }else{
    document.getElementById('LabelLeverancier').classList.add('c_red');
    isValid = false;
    }
    
    if(inputFile.length > 0){
    document.getElementById('excelFile_label').classList.remove('outline_red2');
    document.getElementById('fileLabel').classList.remove('c_red');

    }else{
    document.getElementById('excelFile_label').classList.add('outline_red2');
    document.getElementById('fileLabel').classList.add('c_red');

    isValid = false;
    } 

    if(inputFileName.value.length > 0){
        console.log(inputFileName);
    document.getElementById('sourceFileName').classList.remove('outline_red2');
    document.getElementById('fileNameLabel').classList.remove('c_red');

    }else{
    document.getElementById('sourceFileName').classList.add('outline_red2');
    document.getElementById('fileNameLabel').classList.add('c_red');

    isValid = false;
    } 
 
    if(isValid){
    
    const sendData = {
        supplier: selectedLeverancier,
        sourceFile: selectedFileName,
        inputFileName: inputFileName.value
    };

    console.log("Verzonden Input:", sendData);
     
    document.getElementById("mess1").style.display = 'block';
    document.getElementById("loading").style.display = 'flex';

    // 1) Upload the source file to the FME TEMP folder, then 2) run the workspace
    uploadAndConvert(selectedFile, sendData);

    }


   
    // Hier kun je verdere acties ondernemen, zoals het verzenden van gegevens naar de server
}


// FME Flow config. NOTE: token is exposed in client JS (see docs/known-issues.md);
// prefer a server-side proxy long term.
const FME_BASE_URL = "https://fme.gkbgroep.nl";
const FME_TOKEN = "653d48815e91626f06f6ed871b3810605193ac02";
const FME_TEMP_CONNECTION = "FME_SHAREDRESOURCE_TEMP";

function getSubmitTarget() {
    const target = (window.appSettings && window.appSettings.submitTarget) || {};
    return {
        repository: target.repository ,
        workspace: target.workspace ,
        service: target.service 
    };
}

async function uploadAndConvert(file, sendData) {
    try {
        // STEP 1: upload the source file to the FME TEMP folder (FME Flow REST API V4)
        await uploadFileToFME(file);

        // STEP 2: on success, run the workspace via fmedatastreaming
        // const responseData = await streamWorkspace(sendData);
        const responseData =  await streamWorkspace(sendData);


        document.getElementById("mess1").style.display = 'none';
        document.getElementById("loading").style.display = 'none';

        getResponse(responseData);
    } catch (err) {
        console.error("Conversie mislukt:", err);
        document.getElementById("loading").style.display = 'none';
        document.getElementById("mess1").style.display = 'none';
        const errEl = document.getElementById("errorMessage");
        if (errEl) {
            errEl.style.display = "block";
            errEl.innerHTML = 'Error... conversie kan niet gestart worden.<br/><div class="bold"> Neem contact op met Dirk-Jan of Job</div>';
        }
    }
}

// STEP 1: POST the file to the FME TEMP folder using FME Flow REST API V4
async function uploadFileToFME(file) {
    const uploadUrl = `${FME_BASE_URL}/fmeapiv4/resources/connections/${FME_TEMP_CONNECTION}/upload?path&overwrite=true`;

    const formData = new FormData();
    formData.append("files", file, file.name);

    const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
            "Authorization": "fmetoken token=" + FME_TOKEN,
            "Accept": "application/json"
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Upload naar FME TEMP mislukt. Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Bestand geupload naar FME TEMP:", result);
    return result;
}

// STEP 2: run the workspace via fmedatastreaming with INIT_JSON + SOURCE_FILE
async function streamWorkspace(sendData) {
    const { repository, workspace } = getSubmitTarget();

    // FME workspace expects INIT_JSON (JSON string) and SOURCE_FILE (temp path)
    const initJson = JSON.stringify({
        supplier: sendData.supplier,
        sourceFileName: sendData.inputFileName
    });

    // Params go in the POST body so URLSearchParams percent-encodes {, }, (, ),
    // quotes and spaces (raw braces/parens in the URL trigger a Tomcat 400).
    const params = new URLSearchParams({
        INIT_JSON: JSON.stringify(initJson),
        SOURCE_FILE: `$(${FME_TEMP_CONNECTION})/${sendData.sourceFile}`,
        opt_responseformat: "json",
        token: FME_TOKEN
    });

    console.log("Datastreaming params:", params.toString());

    const url = `${FME_BASE_URL}/fmedatastreaming/${repository}/${workspace}`;
    console.log("Datastreaming URL:", url);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        body: params.toString()
    });
    if (!response.ok) {
        throw new Error(`Datastreaming van workspace mislukt. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Workspace response:", data);
    return data;
}

// Minimal HTML escaping for values placed into innerHTML.
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Extract the "werkorder" option list from the response.
function getWerkorderValues(defs) {
    const lists = (defs && defs.lists) || [];
    const werkorderList = lists.find(l => l.name === 'werkorder') || { values: [] };
    return werkorderList.values || [];
}

// Build a searchable Projectcode combobox: a text input plus a filtered dropdown.
function buildWerkorderSearchHTML() {
    return (
        '<div class="werkorder-search">' +
            '<input type="text" class="input-form werkorder-input" placeholder="zoek projectcode" autocomplete="off">' +
            '<input type="hidden" class="werkorder-value">' +
            '<ul class="werkorder-list"></ul>' +
        '</div>'
    );
}

// Wire prefix-filtering and selection for one Projectcode combobox.
function setupWerkorderSearch(container, values) {
    const input = container.querySelector('.werkorder-input');
    const hidden = container.querySelector('.werkorder-value');
    const list = container.querySelector('.werkorder-list');
    const MAX_RESULTS = 50;

    function render(matches) {
        list.innerHTML = '';
        matches.forEach(v => {
            const li = document.createElement('li');
            li.className = 'werkorder-item';
            li.dataset.value = v.value;
            li.innerHTML =
                '<span class="werkorder-item-value">' + escapeHtml(v.value) + '</span>';
            list.appendChild(li);
        });
        list.style.display = matches.length ? 'block' : 'none';
    }

    function filter() {
        const q = input.value.trim().toLowerCase();
        const matches = (q === ''
            ? values
            : values.filter(v => String(v.value).toLowerCase().startsWith(q))
        ).slice(0, MAX_RESULTS);
        render(matches);
    }

    input.addEventListener('focus', filter);
    input.addEventListener('input', () => {
        hidden.value = ''; // typing invalidates any previous selection
        input.classList.remove('outline_red2');
        filter();
    });

    // mousedown fires before the input's blur, so the selection is not lost.
    list.addEventListener('mousedown', (e) => {
        const li = e.target.closest('.werkorder-item');
        if (!li) return;
        e.preventDefault();
        input.value = li.dataset.value;
        hidden.value = li.dataset.value;
        input.classList.remove('outline_red2');
        list.style.display = 'none';
    });

    input.addEventListener('blur', () => {
        setTimeout(() => { list.style.display = 'none'; }, 150);
    });
}

// Data-stream the filled-in INIT_JSON payload to the second FME workspace.
// repository/workspace/service come from submitTarget in the first FME response.
async function submitToWorkspace(target, payload) {
    const t = target || {};
    const repository = t.repository;
    const workspace = t.workspace;
    const service = t.service || 'fmedatadownload';
    if (!repository || !workspace) {
        throw new Error('submitTarget ontbreekt in de response.');
    }

    // INIT_JSON is a text published parameter. Double-encode so URLSearchParams
    // percent-encodes the braces/quotes (raw braces trigger a Tomcat 400).
    const params = new URLSearchParams({
        INIT_JSON: JSON.stringify(payload),
        opt_responseformat: 'json',
        token: FME_TOKEN
    });

    const url = `${FME_BASE_URL}/fmedatadownload/${repository}/${workspace}`;
    console.log('Submit URL:', url);
    console.log('Submit params:', params.toString());

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: params.toString()
    });
    if (!response.ok) {
        throw new Error(`Verzenden naar workspace mislukt. Status: ${response.status}`);
    }

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
}

// Extract download URL + success status from the second workspace response.
function extractDownloadInfo(result) {
    let data = result;
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = null; }
    }
    if (!data || typeof data !== 'object') {
        // Fall back to a bare URL string
        const raw = String(result || '').trim();
        return { success: /^https?:\/\//i.test(raw), url: /^https?:\/\//i.test(raw) ? raw : '' };
    }

    const sr = data.serviceResponse || data;
    const status = (sr.statusInfo && sr.statusInfo.status) || '';
    const success = String(status).toLowerCase() === 'success';

    const engine = (sr.fmeTransformationResult && sr.fmeTransformationResult.fmeEngineResponse) || {};
    const url = sr.url || engine.downloadUrl || data.downloadUrl || data.url || '';

    return { success, url };
}

// Trigger a browser download for a blob or URL.
function triggerDownload(href, filename, revoke) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename || '';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(href), 1000);
}

// On success: auto-download the result zip; keep a manual link as fallback.
function handleSubmitResult(result) {
    const link = document.getElementById('downloadCsv');
    const { success, url } = extractDownloadInfo(result);

    if (success && url) {
        triggerDownload(url, '');
    }

    if (link) {
        if (url) {
            link.href = url;
            link.style.display = '';
        } else {
            link.style.display = 'none';
        }
    }
}

    function getResponse(responseData){
        const descr = document.getElementById('screen1Descr').style.display = 'none';
        const wrapper = document.getElementById('screen1').style.display = 'none';
        const submitBTN = document.getElementById('myForm').style.display = 'none';
        const screen2 = document.getElementById('screen2').style.display = 'block';
        

            const responsDataSupplier = responseData.supplier;
            const responseDataFile = responseData.sourceFileName;
            const responseDataGroups = responseData.groups || [];
            const responseDataFields = responseData.fields || [];

            const descr2 = document.getElementById('screen2Descr').innerHTML = responseData.supplier + " - " + responseData.sourceFileName;

            // Keep response data available for the Verzenden submission
            currentResponseData = responseData;

            // Build table rows from groups (sorted by order, order itself is skipped)
            const tableBody = document.getElementById('responseTableBody');
            tableBody.innerHTML = '';

             

            const tariefInputHTML = '<input type="number" class="input-form" value="0">';

            // Projectcode column = searchable combobox built from the response "werkorder" list
            const werkorderValues = getWerkorderValues(responseData);
            const werkorderSearchHTML = buildWerkorderSearchHTML();

            const sortedGroups = [...responseDataGroups].sort((a, b) => (a.order || 0) - (b.order || 0));

            sortedGroups.forEach(group => {
                const tr = document.createElement('tr');
                tr.dataset.group = group.id;

                const tdId = document.createElement('td');
                tdId.textContent = group.id;
                tdId.classList.add('tdId');

                const tdLabel = document.createElement('td');
                // preserve newlines from the label (FME sends literal \n)
                tdLabel.style.whiteSpace = 'pre-line';
                tdLabel.textContent = String(group.label || '').replace(/\\n/g, '\n');

                const tdProjectcode = document.createElement('td');
                tdProjectcode.innerHTML = werkorderSearchHTML;

                const tdTarief = document.createElement('td');
                tdTarief.innerHTML = tariefInputHTML;

                tr.appendChild(tdId);
                tr.appendChild(tdLabel);
                tr.appendChild(tdProjectcode);
                tr.appendChild(tdTarief);

                tableBody.appendChild(tr);

                // Wire the searchable projectcode dropdown for this row
                setupWerkorderSearch(tdProjectcode, werkorderValues);

                const tariefEl = tdTarief.querySelector('input[type="number"]');
                if (tariefEl) {
                    tariefEl.addEventListener('input', () => {
                        const num = parseFloat(tariefEl.value);
                        if (tariefEl.value !== '' && !isNaN(num) && num > 0) {
                            tariefEl.classList.remove('outline_red2');
                        }
                    });
                }
            });
 
    }

    async function sendResASInput(event) {
            event.preventDefault();

            const defs = currentResponseData || {};

            // Validate inputs first: projectcode must be selected, tarief must be > 0
            let isValid = true;
            const rows = document.querySelectorAll('#responseTableBody tr');
            rows.forEach(row => {
                const werkorderInput = row.querySelector('.werkorder-input');
                const werkorderValue = row.querySelector('.werkorder-value');
                const numberInput = row.querySelector('input[type="number"]');

                if (werkorderInput && werkorderValue) {
                    if (!werkorderValue.value) {
                        werkorderInput.classList.add('outline_red2');
                        isValid = false;
                    } else {
                        werkorderInput.classList.remove('outline_red2');
                    }
                }

                if (numberInput) {
                    const raw = numberInput.value;
                    const num = parseFloat(raw);
                    if (raw === '' || raw === null || isNaN(num) || num <= 0) {
                        numberInput.classList.add('outline_red2');
                        isValid = false;
                    } else {
                        numberInput.classList.remove('outline_red2');
                    }
                }
            });

            if (!isValid) {
                return;
            }

            // Collect werkorder + tarief per group for the second workspace
            const values = [];
            rows.forEach(row => {
                const groupId = row.dataset.group;
                const werkorderValue = row.querySelector('.werkorder-value');
                const numberInput = row.querySelector('input[type="number"]');

                values.push({
                    group: groupId,
                    name: 'werkorder',
                    value: werkorderValue ? werkorderValue.value : ''
                });
                values.push({
                    group: groupId,
                    name: 'tarief',
                    value: numberInput ? numberInput.value : ''
                });
            });

            // INIT_JSON payload expected by the second FME workspace
            const payload = {
                sessionId: defs.sessionId || '',
                supplier: defs.supplier || '',
                sourceFileName: defs.sourceFileName || defs.sourceFile || '',
                values: values
            };

            console.log('Submission payload:', JSON.stringify(payload, null, 2));
 
            document.getElementById('mess1').style.display = 'block';
            document.getElementById('loading').style.display = 'flex';

            try {
                const target = defs.submitTarget || (currentResponseData && currentResponseData.submitTarget);
                const result = await submitToWorkspace(target, payload);
                console.log('Second workspace response:', result);
                handleSubmitResult(result);

                document.getElementById('screen2').style.display = 'none';
                document.getElementById('screen3').style.display = 'block';
            } catch (err) {
                console.error('Verzenden mislukt:', err);
                const errEl = document.getElementById('errorMessage');
                if (errEl) {
                    errEl.style.display = 'block';
                    errEl.innerHTML = 'Error... verzenden mislukt.<br/><div class="bold"> Neem contact op met Dirk-Jan of Job</div>';
                }
            } finally {
                document.getElementById('mess1').style.display = 'none';
                document.getElementById('loading').style.display = 'none';
            }
        }