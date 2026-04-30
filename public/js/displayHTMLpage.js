const data = window.templateChoice;
    console.log(data)
    const repo = data['repository'];
    const workspaceName = data['workspace'];
    const serviceName = data['service'];
    console.log(serviceName)
    
    if (data?.template?.name === "GKB Form template") {
        console.log('GKB Form template');
        (async () => {
                    
            // laden parameter html elementen naar html elementen voor form
            try {
                const repo = data.repository;
                const workspaceName = data.workspace;
                const response = await fetch(`https://fme-gkb.fmecloud.com/fmeapiv4/workspaces/${repo}/${workspaceName}`, {
                    method: "GET",
                    headers: {
                        "Authorization": "fmetoken token=653d48815e91626f06f6ed871b3810605193ac02",
                        "Accept": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                        
                const workspaceData = await response.json();
                console.log( 'Full response of the request: ');
                console.log( workspaceData);
                
                const parameters = workspaceData.parameters;
                const container = document.getElementById('GKB_Form_Template');
                // foreach alle parameters 
                let req = '';
                parameters.forEach(param => {
                     
                    if (param.required !== false) {
                        req ='*';
                    } else if (param.required === false) {
                        req =' ';  
                    }

                    const label = document.createElement('label');
                    label.textContent = (param.description || param.prompt) + req;
                    label.setAttribute('for', param.prompt);

                    let input;
                    let selectFileText;
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
                        // als parameter required is ( dus hij is niet optioneel )
                        if(param.required !== false) {
                         
                            selectFileText = document.createElement('label');
                            selectFileText.id = 'data_label';
                            selectFileText.textContent = 'Selecteer hier uw bestand';
                            selectFileText.setAttribute('for', param.name+'_req');
                            selectFileText.className = 'btn btn-upload mb-3 file-btn text-center';
                            
                            input = document.createElement('input');
                            input.type = 'file';
                            input.name = param.name;
                            input.id = param.name+'_req';
                            input.className = 'position-absolute invisible';
                            input.setAttribute("data-required","true");

                            input.addEventListener('change', (e) => {
                            const file = e.target.files[0];
                            selectFileText.textContent = file ? file.name : 'Selecteer hier uw bestand';
                            });
                        // als parameter niet required is ( dus hij is optioneel)
                        } else if (param.required == false) {
                                    
                            selectFileText = document.createElement('label');
                            selectFileText.id = 'data_label';
                            selectFileText.textContent = 'Selecteer hier uw bestand';
                            selectFileText.setAttribute('for', param.name);
                            selectFileText.className = 'btn btn-upload mb-3 file-btn text-center';
                            
                            input = document.createElement('input');
                            input.type = 'file';
                            input.name = param.name;
                            input.id = param.name+'_req';
                            input.className = 'position-absolute invisible';

                            input.addEventListener('change', (e) => {
                            const file = e.target.files[0];
                            selectFileText.textContent = file ? file.name : 'Selecteer hier uw bestand';
                            });

                        }
                    
                        
                    } else if (param.type === 'checkbox') { 
                        if(param.required !== false){
                            input = document.createElement('input');
                            input.type = 'checkbox';
                            input.name = param.name;
                            input.id = param.name;
                            input.value = param.defaultValue || '';
                            input.className = 'input-form-checkbox';
                            input.setAttribute("data-required","true");
                        }
                            
                        else if(param.required == false){
                            input = document.createElement('input');
                            input.type = 'checkbox';
                            input.name = param.name;
                            input.id = param.name;
                            input.className = 'input-form-checkbox';
                            input.setAttribute("data-required","true");
                        }
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
                    
                    inputWrap.appendChild(input);
                    inputWrap.appendChild(document.createElement('br'));

                    container.appendChild(inputWrap);
                });

            } 
            
            catch (err) {
                console.error("Fetch failed:", err);
            }
             
    // next funtion
    
        })  ();

        function handleFormSubmit(event) {
            event.preventDefault(); // Stop default form submission

            const formContainer = document.getElementById('GKB_Form_Template');
            const inputs = formContainer.querySelectorAll('input');
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
                                formData.append('files', input.files[0], input.files[0].name);
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
                        
                        if (input.type === 'checkbox') {
                            if (!input.value) {
                                document.getElementById(input.name).classList.add('outline_red2');
                                 
                                  
                                isValid = false;
                                return;
                            }  else {
                                document.getElementById(input.name).classList.remove('outline_red2'); 
                                
                            }
                            
                        }
                        
                } else { }
                            input.addEventListener('change', function () {
                            console.log(this.value);
                        });
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
                         fetch('https://fme-gkb.fmecloud.com/fmeapiv4/resources/connections/FME_SHAREDRESOURCE_TEMP/upload?path&overwrite=true ', {
                                method: 'POST',
                                headers: {
                                    "Authorization": "fmetoken token=653d48815e91626f06f6ed871b3810605193ac02",
                                    "Accept":"application/json",
                                },
                                processData: false,
                                contentType: false,
                                body: formData
                            })
                            .then(response => {
                                if (!response.ok) throw new Error(`Upload failed. Status: ${response.status}`);
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
                            });
                }

                function StartWorkspace(publishedParameters) {
                    // run workspace with the publishedParameters
                    const repo = window.templateChoice.repository;
                    const workspaceName = window.templateChoice.workspace;
                    const serviceName = window.templateChoice.service;

                    // Convert array of {name, value} to object {name: value}
                    
                    const paramsObject = {};
                    
                    publishedParameters.forEach(p => {
                        paramsObject[p.name] = p.value;
                    });
                    
                    if (serviceName === 'fmedatastreaming') {
                        // Construct params string from publishedParameters
                        let paramsString = '';
                        publishedParameters.forEach(p => {
                            paramsString += '&' + p.name + '=' + encodeURIComponent(p.value);
                        });
                        
                        // Use workspace and repo as project and file variables
                        const projectName = repo;
                        const fmwFile = workspaceName;
                        
                        const url = "https://fme-gkb.fmecloud.com/fmedatastreaming/" + projectName + "/" + fmwFile + "?" + paramsString + "&opt_responseformat=json&token=653d48815e91626f06f6ed871b3810605193ac02";
                        
                        console.log(url);
                        
                        // Write html response in iframe or download file based on content-type
                        fetch(url)
                            .then(r => {
                                if (r.status !== 200) {
                                    console.error("Request failed with status: " + r.status);
                                    document.getElementById("loading").style.display = 'none';
                                    document.getElementById("mess1").style.display = 'none';
                                    document.getElementById("errorMessage").style.display = "block";
                                    document.getElementById('errorMessage').innerHTML = 'Error... conversie kan niet gestart worden.<br/><div class="bold"> Neem contact op met Dirk-Jan of Job</div>';
                                    return;
                                }
                                const contentType = r.headers.get('content-type') || '';
                                console.log(contentType);
                                if (contentType ==='text/html' ) {
                                    return r.text().then(html => {
                                        const iframe = document.getElementById('fmeFrame');
                                        iframe.style.display = 'block';
                                        const doc = iframe.contentWindow.document;
                                        doc.open();
                                        doc.write(html);
                                        doc.close();
                                        document.getElementById("mess1").style.display = 'none';
                                        document.getElementById("loading").style.display = 'none';
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
                                    // Fallback: build filename from workspace name + extension guessed from content-type
                                    if (!filename) {
                                        const extMap = {
                                            'text/csv': 'csv',
                                            'application/json': 'json',
                                            'application/zip': 'zip',
                                            'application/pdf': 'pdf',
                                            'application/xml': 'xml',
                                            'text/xml': 'xml',
                                            'text/plain': 'txt',
                                            'application/vnd.ms-excel': 'xls',
                                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
                                        };
                                        const ct = (contentType.split(';')[0] || '').trim().toLowerCase();
                                        const ext = extMap[ct] || 'dat';
                                        const base = (workspaceName || 'download').replace(/\.[^.]+$/, '');
                                        filename = `${base}.${ext}`;
                                        console.warn('No content-disposition filename available (likely CORS: server must send "Access-Control-Expose-Headers: Content-Disposition"). Falling back to:', filename);
                                    }
                                    return r.blob().then(blob => {
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
                                console.error("Request failed with status: " + err);
                                document.getElementById("loading").style.display = 'none';
                                document.getElementById("mess1").style.display = 'none';
                                document.getElementById("errorMessage").style.display = "block";
                                document.getElementById('errorMessage').innerHTML = 'Error... conversie kan niet gestart worden.<br/><div class="bold"> Neem contact op met Dirk-Jan of Job</div>';
                            });
                    } else if (serviceName === 'fmejobsubmitter') {
                        console.log(paramsObject)
                        fetch(`https://fme-gkb.fmecloud.com/fmeapiv4/jobs/sync`, {
                            method: 'POST',
                            headers: {
                                "Authorization":"fmetoken token=653d48815e91626f06f6ed871b3810605193ac02",
                                "Content-Type":"application/json",
                                "Accept":"application/json",
                            },
                            body: JSON.stringify({
                                repository: repo,
                                workspace: workspaceName,
                                publishedParameters: paramsObject,
                            })
                        })
                        .then(res => {
                            if (!res.ok) throw new Error(`Workspace start failed: ${res.status}`);
                            return res.json();
                        })
                        .then(data => {
                            console.log(data)

                            document.getElementById("mess1").style.display = 'none';
                            document.getElementById("loading").style.display = 'none';
                            document.getElementById("mess2").style.display = 'block';
                            document.getElementById("mess2").innerHTML = 'De conversie is klaar!';
                        })
                        .catch(err => {
                            console.error("Request failed with status: " + err);
                            document.getElementById("loading").style.display = 'none';
                            document.getElementById("mess1").style.display = 'none';
                            document.getElementById("errorMessage").style.display = "block";
                            document.getElementById('errorMessage').innerHTML = 'Error... conversie kan niet gestart worden.<br/><div class="bold"> Neem contact op met Dirk-Jan of Job</div>';
                        });
                    } else if (serviceName === 'fmedatadownload') {
                        console.log('datadownload');
                    }
                }

        }

        
    } 
 
    else {
        console.log("Template is not 'GKB Form template'; skipping fetch.");
    } 


    if (data?.template?.name === "GKB Rapport template") {
        console.log('GKB Rapport template is running')
    } 
    
    else {
        console.log("Template is not 'GKB Rapport template'; skipping fetch.");
    }

    