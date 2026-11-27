const data = window.templateChoice;
const appHash = window.appHash;

const serviceName = data['service'];
const csrfToken = document.querySelector('input[name="_token"]')?.value
    || document.querySelector('meta[name="csrf-token"]')?.content
    || '';

// Show red error text inside the form's error div and hide the loading state.
function showFormError(message) {
    document.getElementById("loading")?.style && (document.getElementById("loading").style.display = 'none');
    document.getElementById("mess1")?.style && (document.getElementById("mess1").style.display = 'none');
    const el = document.getElementById("errorMessage");
    if (el) {
        el.style.display = "block";
        el.style.color = "red";
        el.textContent = message;
    }
}

// Read a { "message": "..." } body from a failed proxy response, if present.
async function extractErrorMessage(response, fallback) {
    try {
        const body = await response.clone().json();
        if (body && body.message) return body.message;
    } catch (e) { /* not JSON */ }
    return fallback;
}   

const RUN_ERROR_FALLBACK = 'Error... conversie kan niet gestart worden.';

// Show a failed workspace run: the reason (from the server) plus who to contact.
function showRunError(message) {
    showFormError(message || RUN_ERROR_FALLBACK);
    const contact = document.createElement('div');
    contact.className = 'bold';
    contact.textContent = 'Neem contact op met Dirk-Jan of Job';
    document.getElementById("errorMessage")?.append(document.createElement('br'), contact);
}

// Throw with the server's error message when the run failed.
async function ensureRunOk(response) {
    if (!response.ok) {
        console.error("Request failed with status: " + response.status);
        throw new Error(await extractErrorMessage(response, `${RUN_ERROR_FALLBACK} (status ${response.status})`));
    }
    return response;
}
    
    
    if (data?.template?.name === "Default FME Workflow") {
        console.log('Default FME Workflow');
        (async () => {
                    
            // laden parameter html elementen naar html elementen voor form
            try {
                const response = await fetch(`/apps/${appHash}/fme/parameters`, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                });

                if (!response.ok) {
                    const message = await extractErrorMessage(
                        response,
                        `Kan de app niet laden (status ${response.status}).`
                    );
                    showFormError(message);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                        
                const workspaceData = await response.json();
                console.log( 'Full response of the request: ');
                console.log( response);
                
                const parameters = workspaceData.parameters;
                const container = document.getElementById('GKB_Form_Template');
                // foreach alle parameters 
                let req = '';
                parameters.forEach(param => {
                     
                    if (param.required !== false) {
                        console.log(param);
                        req ='*';
                    } else if (param.required === false) {
                        // console.log(param);
                        req =' ';  
                    }

                    const label = document.createElement('label');
                    label.textContent = (param.description || param.prompt) + req;
                    label.setAttribute('for', param.prompt);

                    let input;
                    let selectFileText;
                    let checkboxWrapper;
                    // console.log(param)
                    // check if parameter type is string
                    if (param.type === 'text') { 
                        // console.log(param.name)
                        // als parameter required is ( dus hij is niet optioneel )
                        if(param.required !== false) {

                            input = document.createElement('input');
                            input.type = 'text';
                            input.name = param.name;
                            input.id = param.name;
                            input.value = param.defaultValue || '';
                            input.className = 'input-form';
                            input.setAttribute("data-required","true");
                        // als parameter required is ( dus hij is optioneel )
                        } else if (param.required == false) {

                            input = document.createElement('input');
                            input.type = 'text';
                            input.name = param.name;
                            input.id = param.name;
                            input.value = param.defaultValue || '';
                            input.className = 'input-form';

                        }

                        // check if parameter type is file
                    } else if (param.type === 'file' || param.type === 'list') {
                        const isRequired = param.required !== false;
                        const inputId = param.name + '_req';

                        input = document.createElement('input');
                        input.type = 'file';
                        input.name = param.name;
                        input.id = inputId;
                        input.className = 'position-absolute invisible dropzone-input';
                        if (isRequired) input.setAttribute('data-required', 'true');

                        selectFileText = document.createElement('label');
                        selectFileText.id = 'data_label';
                        selectFileText.setAttribute('for', inputId);
                        selectFileText.className = 'btn btn-upload mb-3 file-btn text-center file-dropzone';
                        selectFileText.innerHTML = `
                            <div class="file-dropzone__text">
                                <svg class="file-dropzone__icon" aria-hidden="true" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="8" y="40" width="48" height="16" rx="6" fill="currentColor" opacity="0.25"></rect>
                                    <rect x="24" y="44" width="6" height="6" rx="3" fill="currentColor"></rect>
                                    <path d="M32 8 L32 36" stroke="currentColor" stroke-width="5" stroke-linecap="round"></path>
                                    <path d="M20 26 L32 38 L44 26" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                                <span class="file-dropzone__link">Kies een bestand</span> of sleep het hierin.
                            </div>
                            <div class="file-dropzone__filename"></div>
                        `;

                        const filenameEl = selectFileText.querySelector('.file-dropzone__filename');

                        const setFile = (file) => {
                            if (file) {
                                filenameEl.textContent = file.name;
                                selectFileText.classList.add('has-file');
                                selectFileText.classList.remove('outline_red2');
                            } else {
                                filenameEl.textContent = '';
                                selectFileText.classList.remove('has-file');
                            }
                        };

                        input.addEventListener('change', (e) => {
                            setFile(e.target.files[0]);
                        });

                        ['dragenter', 'dragover'].forEach(ev => {
                            selectFileText.addEventListener(ev, (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectFileText.classList.add('is-dragover');
                            });
                        });
                        ['dragleave', 'dragend'].forEach(ev => {
                            selectFileText.addEventListener(ev, (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectFileText.classList.remove('is-dragover');
                            });
                        });
                        selectFileText.addEventListener('drop', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectFileText.classList.remove('is-dragover');
                            const dropped = e.dataTransfer && e.dataTransfer.files;
                            if (dropped && dropped.length > 0) {
                                const dt = new DataTransfer();
                                dt.items.add(dropped[0]);
                                input.files = dt.files;
                                setFile(dropped[0]);
                            }
                        });

                    } else if (param.type === 'checkbox') { 
                        if(param.required !== false){
                            input = document.createElement('input');
                            input.type = 'checkbox';
                            input.name = param.name;
                            input.id = param.name;
                            input.value = param.defaultValue || '';
                            input.className = 'input-form-checkbox';
                            input.setAttribute("data-required","true");
                            input.checked = (param.defaultValue || '').toString().toUpperCase() === 'YES';
                        }
                            
                        else if(param.required == false){
                            input = document.createElement('input');
                            input.type = 'checkbox';
                            input.name = param.name;
                            input.id = param.name;
                            input.className = 'input-form-checkbox';
                            // input.value = param.defaultValue || '';
                            input.checked = (param.defaultValue || '').toString().toUpperCase() === 'YES';
                            input.setAttribute("data-required","true");
                            // console.log(input.value)
                        }

                        checkboxWrapper = document.createElement('div');
                        checkboxWrapper.className = 'checkbox-wrapper';
                        checkboxWrapper.appendChild(input);
                        checkboxWrapper.addEventListener('click', (e) => {
                            if (e.target === input) return;
                            input.checked = !input.checked;
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        });
                        
                    } else if (param.type === 'datetime') { 
                        // FME datetime defaults are usually YYYYMMDDHHMMSS[.sss] or "YYYY-MM-DD HH:MM:SS";
                        // datetime-local needs YYYY-MM-DDTHH:MM(:SS) or it silently shows empty.
                        const toDatetimeLocal = (v) => {
                            if (!v) return '';
                            const s = String(v).trim();
                            const digits = s.replace(/\D/g, '');
                            if (digits.length >= 12) {
                                const y = digits.slice(0, 4);
                                const mo = digits.slice(4, 6);
                                const d = digits.slice(6, 8);
                                const h = digits.slice(8, 10);
                                const mi = digits.slice(10, 12);
                                const se = digits.slice(12, 14);
                                return `${y}-${mo}-${d}T${h}:${mi}` + (se ? `:${se}` : '');
                            }
                            return s.replace(' ', 'T');
                        };
                        const nowLocal = () => {
                            const n = new Date();
                            const pad = (x) => String(x).padStart(2, '0');
                            return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
                        };
                        const normalizedDefault = toDatetimeLocal(param.defaultValue) || nowLocal();

                        if(param.required !== false){
                            input = document.createElement('input');
                            input.type = 'datetime-local';
                            input.name = param.name;
                            input.id = param.name;
                            input.value = normalizedDefault;
                            input.className = 'input-form-datetime';
                            input.setAttribute("data-required","true");

                            console.log(param.defaultValue)
                             
                        }
                            
                        else if(param.required == false){
                            input = document.createElement('input');
                            input.type = 'datetime-local';
                            input.name = param.name;
                            input.id = param.name;
                            input.className = 'input-form-datetime';
                            input.value = normalizedDefault;
                             
                            input.setAttribute("data-required","true");
                            // console.log(input.value)
                        }

                        const openPicker = () => {
                            if (typeof input.showPicker === 'function') {
                                try { input.showPicker(); } catch (e) { /* ignore */ }
                            }
                        };
                        input.addEventListener('click', openPicker);
                        input.addEventListener('focus', openPicker);

                    } else if (param.type === 'dropdown') {
                        const isRequired = param.required !== false;
                        const settings = param.choiceSettings || {};
                        const choices = Array.isArray(settings.choices) ? [...settings.choices] : [];

                        if (settings.sort === 'naturalSort') {
                            choices.sort((a, b) => String(a.display ?? a.value).localeCompare(
                                String(b.display ?? b.value), undefined, { numeric: true, sensitivity: 'base' }
                            ));
                        }

                        input = document.createElement('select');
                        input.name = param.name;
                        input.id = param.name;
                        input.className = 'input-form';
                        if (isRequired) input.setAttribute('data-required', 'true');

                        const defaultValue = param.defaultValue != null ? String(param.defaultValue) : '';
                        const hasDefault = choices.some(c => String(c.value) === defaultValue);

                        // Placeholder when nothing valid is preselected; optional dropdowns may stay empty.
                        if (!hasDefault || !isRequired) {
                            const placeholder = document.createElement('option');
                            placeholder.value = '';
                            placeholder.textContent = isRequired ? 'Kies een optie' : '';
                            if (isRequired) placeholder.disabled = true;
                            input.appendChild(placeholder);
                        }

                        choices.forEach(choice => {
                            const option = document.createElement('option');
                            option.value = choice.value;
                            option.textContent = choice.display ?? choice.value;
                            input.appendChild(option);
                        });

                        input.value = hasDefault ? defaultValue : '';
                        input.addEventListener('change', () => input.classList.remove('outline_red2'));

                    }
                    
                    else {
                        input = document.createElement('input');
                        input.type = 'text';
                        input.name = param.name;
                        input.id = param.name;
                        input.value = `Unsupported field type: ${param.type}`;
                    }

                    const inputWrap = document.createElement('div');
                    inputWrap.classList.add('input-wrap');

                    if (selectFileText) {
                        inputWrap.appendChild(label)
                        inputWrap.appendChild(selectFileText);
                    } else {
                        inputWrap.appendChild(label);
                    } 
                    
                    if (checkboxWrapper) {
                        inputWrap.appendChild(checkboxWrapper);
                    } else {
                        inputWrap.appendChild(input);
                    }
                    inputWrap.appendChild(document.createElement('br'));

                    container.appendChild(inputWrap);
                });

                const submitWrap = document.getElementById('submitWrap');
                if (submitWrap) submitWrap.style.display = '';

            } 
            
            catch (err) {
                console.error("Fetch failed:", err);
                if (document.getElementById("errorMessage")?.style.display !== "block") {
                    showFormError("Er is een fout opgetreden bij het laden van de app.");
                }
            }

            finally {
                const formLoader = document.getElementById('formLoader');
                if (formLoader) formLoader.style.display = 'none';
            }
             
    // next funtion
    
        })  ();

        function handleFormSubmit(event) {
            event.preventDefault(); // Stop default form submission

            const formContainer = document.getElementById('GKB_Form_Template');
            const inputs = formContainer.querySelectorAll('input, select');
            let inputFiles = false;
            let isValid = true;
        
            const formData = new FormData();
 
                inputs.forEach(input => {
                    const isRequired = input.hasAttribute('data-required') && input.getAttribute('data-required') === 'true';

               if (isRequired) {
                        if (input.type === 'file') {
                            if (input.files.length === 0) {
                                const label = document.querySelector(`label[for="${input.name}_req"]`);
                                if (label) label.classList.add('outline_red2');
                                isValid = false;
                                return;
                            } else {
                                const label = document.querySelector(`label[for="${input.name}_req"]`);
                                if (label) label.classList.remove('outline_red2');
                                formData.append('files[]', input.files[0], input.files[0].name);
                                inputFiles = true;
                            }
                        }

                        if (input.type === 'text') {
                            if (!input.value.trim()) {
                                document.getElementById(input.name).classList.add('outline_red2');
                                
                                isValid = false;
                                return;
                            }  else {
                                document.getElementById(input.name).classList.remove('outline_red2'); 
                            }
                        }

                        if (input.tagName === 'SELECT') {
                            if (!input.value) {
                                input.classList.add('outline_red2');
                                isValid = false;
                                return;
                            }
                            input.classList.remove('outline_red2');
                        }
                        
                        if (input.type === 'checkbox') {
                            if (!input.value) {
                                document.getElementById(input.name).classList.add('outline_red2');
                                 if(input.checked) {
                                    // Do something if the checkbox is checked
                                    input.value = 'Yes';
                                } else {
                                    input.value = 'No';
                                }
                                console.log(input.value)  
                                isValid = false;
                                return;
                            }  else {
                                document.getElementById(input.name).classList.remove('outline_red2'); 
                                if(input.checked) {
                                    // Do something if the checkbox is checked
                                    input.value = 'Yes';
                                } else {
                                    input.value = 'No';
                                }
                                console.log(input.value)  

                            }
                            
                        }
                        
                } else { }
                            
                });
                 
                if (!isValid) {
                        console.warn("Form not submitted due to validation errors.");
                        return;
                }
                if (isValid) {
                        console.log("Form correct!");
                         document.getElementById("mess1").style.display = 'block';
                        document.getElementById("loading").style.display = 'flex';

                        if(inputFiles === true){
                            console.log(inputFiles)
                            uploadToServerAndStartWorkspace();
                        } else if ( inputFiles === false ) {

                            const workspaceParams = [];
                            inputs.forEach(input => {
                      
                                workspaceParams.push({
                                    name: input.name,
                                    value: input.value
                                });
 
                            });
                            
                            StartWorkspace(workspaceParams);
                            
                        }
                        // uploadToServerAndStartWorkspace();
                }
                // Optional: preview or debug
                for (let pair of formData.entries()) {
                console.log(`${pair[0]}:`, pair[1]);
                }

                // function uploadToServerAndStartWorkspace()
                function uploadToServerAndStartWorkspace() {
                    // here make post requests to fme server to upload the file, then after success response run function StartWorkspace that sends an post request to the api to run the workspace. POST with the input values and file names.
                        // upload files to /FME_SHAREDRESOURCE_TEMP/filesys
                        console.log('Ditis de formdata:',formData)
                         fetch(`/apps/${appHash}/fme/upload`, {
                                method: 'POST',
                                headers: {
                                    "Accept": "application/json",
                                    "X-CSRF-TOKEN": csrfToken,
                                },
                                body: formData
                            })
                            .then(async response => {
                                if (!response.ok) {
                                    console.error("Upload failed with status: " + response.status);
                                    const fallback = response.status === 413
                                        ? 'Het bestand is te groot om te uploaden.'
                                        : `Uploaden mislukt (status ${response.status}).`;
                                    throw new Error(await extractErrorMessage(response, fallback));
                                }
                                return response.json();
                            })
                            .then(uploadResult => {
                                console.log('File upload success:', uploadResult);

                                // STEP 2: Extract values from inputs again for workspace parameters
                                const workspaceParams = [];

                                inputs.forEach(input => {
                                    if (input.type === 'file' && input.files.length > 0) {
                                        workspaceParams.push({
                                            name: input.name,
                                            value: "$(FME_SHAREDRESOURCE_TEMP)/" + input.files[0].name
                                        });
                                    } else {
                                        workspaceParams.push({
                                            name: input.name,
                                            value: input.value
                                        });
                                    }
                                });

                                // Call your workspace start function
                                StartWorkspace(workspaceParams);
                            })
                            .catch(error => {
                                console.error("Upload or start failed:", error);
                                // TypeError = network failure, e.g. the server dropped a too-large upload.
                                showFormError(error instanceof TypeError
                                    ? 'Uploaden mislukt: de server is niet bereikbaar of het bestand is te groot.'
                                    : error.message);
                            });
                }

                function StartWorkspace(publishedParameters) {
                    // run workspace with the publishedParameters
                    const serviceName = window.templateChoice.service;

                    console.log(serviceName)
                    // Convert array of {name, value} to object {name: value}
                    
                    const paramsObject = {};
                    
                    publishedParameters.forEach(p => {
                        paramsObject[p.name] = p.value;
                    });
                    
                    if (serviceName === 'fmedatastreaming') {
                        // Run via the server-side proxy; the token stays on the server.
                        // Write html response in iframe or download file based on content-type
                        console.log(paramsObject);
                        fetch(`/apps/${appHash}/fme/run`, {
                            method: 'POST',
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRF-TOKEN": csrfToken,
                                "Accept": "*/*",
                            },
                            body: JSON.stringify({ parameters: paramsObject })
                        })
                            .then(ensureRunOk)
                            .then(r => {
                                const contentType = r.headers.get('content-type') || '';
                                console.log(contentType);
                                // Laravel sends "text/html; charset=UTF-8", so compare the media type only.
                                const mediaType = (contentType.split(';')[0] || '').trim().toLowerCase();
                                const isAttachment = /^\s*attachment/i.test(r.headers.get('content-disposition') || '');
                                if (mediaType === 'text/html' && !isAttachment) {
                                    return r.text().then(html => {
                                        const iframe = document.getElementById('fmeFrame');
                                        iframe.style.display = 'block';
                                        const doc = iframe.contentWindow.document;
                                        doc.open();
                                        doc.write(html);
                                        doc.close();
                                        document.getElementById("mess1").style.display = 'none';
                                        document.getElementById("mess1").style.padding = '0';
                                        document.getElementById("form").style.padding = '0';
                                        document.getElementById("description").style.display = 'none';
                                        document.getElementById("loading").style.display = 'none';
                                        document.getElementById("GKB_Form_Template").style.display = 'none';
                                        document.getElementById("submitWrap").style.display = 'none';
    
                                    });
                                } else {
                                    const disposition = r.headers.get('content-disposition') || '';
                                    console.log('content-disposition header:', disposition);
                                    console.log('all exposed response headers:');
                                    r.headers.forEach((v, k) => console.log('  ', k, ':', v));
                                    let filename = '';
                                    // Prefer RFC 5987 filename*=UTF-8''... if present
                                    const starMatch = disposition.match(/filename\*=(?:([\w-]+)'[^']*')?([^;]+)/i);
                                    const plainMatch = disposition.match(/filename="?([^;"]+)"?/i);
                                    if (starMatch) {
                                        try { filename = decodeURIComponent(starMatch[2].trim()); }
                                        catch (e) { filename = starMatch[2].trim(); }
                                    } else if (plainMatch) {
                                        filename = plainMatch[1].trim();
                                    }
                                    const extMap = {
                                        'text/csv': 'csv',
                                        'application/json': 'json',
                                        'application/zip': 'zip',
                                        'application/x-zip': 'zip',
                                        'application/x-zip-compressed': 'zip',
                                        'application/zip-compressed': 'zip',
                                        'application/pdf': 'pdf',
                                        'application/xml': 'xml',
                                        'text/xml': 'xml',
                                        'text/plain': 'txt',
                                        'text/html': 'html',
                                        'application/vnd.ms-excel': 'xls',
                                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
                                    };
                                    return r.blob().then(blob => blob.slice(0, 4).arrayBuffer().then(buf => {
                                        // Fallback: build filename from workspace name + extension from content-type,
                                        // or from the file signature when FME sends a generic type (e.g. application/octet-stream).
                                        if (!filename) {
                                            const sig = Array.from(new Uint8Array(buf)).map(b => String.fromCharCode(b)).join('');
                                            const sniffed = sig.startsWith('PK') ? 'zip' : sig.startsWith('%PDF') ? 'pdf' : '';
                                            const ext = extMap[mediaType] || sniffed || 'dat';
                                            const base = (data.name || 'download').replace(/\.[^.]+$/, '');
                                            filename = `${base}.${ext}`;
                                            console.warn('No content-disposition filename from FME. Falling back to:', filename, '(content-type:', mediaType, ')');
                                        }
                                        return blob;
                                    })).then(blob => {
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = blobUrl;
                                        a.download = filename;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        URL.revokeObjectURL(blobUrl);
                                        document.getElementById("mess1").style.display = 'none';
                                        document.getElementById("loading").style.display = 'none';
                                    });
                                }
                            })
                            .catch(err => {
                                console.error(err);
                                // TypeError = network failure ("Failed to fetch"); show the generic text then.
                                showRunError(err instanceof TypeError ? '' : err.message);
                            });
                    } else if (serviceName === 'fmejobsubmitter') {
                        console.log(paramsObject)
                        fetch(`/apps/${appHash}/fme/run`, {
                            method: 'POST',
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRF-TOKEN": csrfToken,
                                "Accept": "application/json",
                            },
                            body: JSON.stringify({
                                parameters: paramsObject,
                            })
                        })
                        .then(ensureRunOk)
                        .then(res => res.json())
                        .then(data => {
                            console.log(data)

                            document.getElementById("mess1").style.display = 'none';
                            document.getElementById("loading").style.display = 'none';
                            document.getElementById("mess2").style.display = 'block';
                            document.getElementById("mess2").innerHTML = 'De conversie is klaar!';
                        })
                        .catch(err => {
                            console.error(err);
                            showRunError(err instanceof TypeError ? '' : err.message);
                        });
                    } else if (serviceName === 'fmedatadownload') {
                        // Run via the server-side proxy; FME returns a JSON envelope
                        // containing a temporary result URL that we auto-download.
                        fetch(`/apps/${appHash}/fme/run`, {
                            method: 'POST',
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRF-TOKEN": csrfToken,
                                "Accept": "application/json",
                            },
                            body: JSON.stringify({ parameters: paramsObject })
                        })
                        .then(ensureRunOk)
                        .then(res => res.json())
                        .then(data => {
                            const sr = data.serviceResponse || data;
                            const status = (sr.statusInfo && sr.statusInfo.status) || '';
                            const success = String(status).toLowerCase() === 'success';
                            const engine = (sr.fmeTransformationResult && sr.fmeTransformationResult.fmeEngineResponse) || {};
                            const url = sr.url || engine.downloadUrl || data.downloadUrl || data.url || '';

                            if (!success || !url) {
                                throw new Error('Geen download-URL in de response.');
                            }

                            // Auto-click a hidden link to trigger the browser download.
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = '';
                            a.rel = 'noopener';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();

                            document.getElementById("mess1").style.display = 'none';
                            document.getElementById("loading").style.display = 'none';
                            document.getElementById("mess2").style.display = 'block';
                            document.getElementById("mess2").innerHTML = 'De conversie is klaar!';
                        })
                        .catch(err => {
                            console.error(err);
                            showRunError(err instanceof TypeError ? '' : err.message);
                        });
                    }
                }

        }

        
    } 
 
    else {
        console.log("Template is not 'Default FME Workflow'; skipping fetch.");
    } 


    if (data?.template?.name === "GKB Rapport template") {
        console.log('GKB Rapport template is running')
    } 
    
    else {
        console.log("Template is not 'GKB Rapport template'; skipping fetch.");
    }

    