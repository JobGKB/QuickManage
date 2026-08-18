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
    setTimeout(() => {

        getResponse();

        document.getElementById("mess1").style.display = 'none';
        document.getElementById("loading").style.display = 'none';
    }, 3000);

    }


   
    // Hier kun je verdere acties ondernemen, zoals het verzenden van gegevens naar de server
}



    function getResponse(){
        const descr = document.getElementById('screen1Descr').style.display = 'none';
        const wrapper = document.getElementById('screen1').style.display = 'none';
        const submitBTN = document.getElementById('myForm').style.display = 'none';
        const screen2 = document.getElementById('screen2').style.display = 'block';
        

        const responseData = {
                    
                }


            const responsDataSupplier = responseData.fieldDefinitions.supplier;
            const responseDataFile = responseData.fieldDefinitions.sourceFile;
            const responseDataGroups = responseData.fieldDefinitions.groups;
            const responseDataFields = responseData.fieldDefinitions.fields;

            const descr2 = document.getElementById('screen2Descr').innerHTML = responseData.fieldDefinitions.supplier + " - " + responseData.fieldDefinitions.sourceFile;

            // Keep response data available for the Verzenden submission
            currentResponseData = responseData;

            // Build table rows from groups (sorted by order, order itself is skipped)
            const tableBody = document.getElementById('responseTableBody');
            tableBody.innerHTML = '';

             

            const tariefInputHTML = '<input type="number" class="input-form" value="0">';

            const sortedGroups = [...responseDataGroups].sort((a, b) => (a.order || 0) - (b.order || 0));

            sortedGroups.forEach(group => {
                const tr = document.createElement('tr');
                tr.dataset.group = group.id;

                const tdId = document.createElement('td');
                tdId.textContent = group.id;

                const tdLabel = document.createElement('td');
                // preserve newlines from the label
                tdLabel.style.whiteSpace = 'pre-line';
                tdLabel.textContent = group.label;

                const tdProjectcode = document.createElement('td');
                tdProjectcode.innerHTML = projectcodeSelectHTML;

                const tdTarief = document.createElement('td');
                tdTarief.innerHTML = tariefInputHTML;

                tr.appendChild(tdId);
                tr.appendChild(tdLabel);
                tr.appendChild(tdProjectcode);
                tr.appendChild(tdTarief);

                tableBody.appendChild(tr);

                // Remove red error border as soon as the user fixes the value
                const selectEl = tdProjectcode.querySelector('select');
                if (selectEl) {
                    selectEl.addEventListener('change', () => {
                        if (selectEl.value) selectEl.classList.remove('outline_red2');
                    });
                }
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

    function sendResASInput(event) {
            event.preventDefault();

            const defs = (currentResponseData && currentResponseData.fieldDefinitions) || {};

            // Validate inputs first: projectcode must be selected, tarief must be > 0
            let isValid = true;
            const rows = document.querySelectorAll('#responseTableBody tr');
            rows.forEach(row => {
                const select = row.querySelector('select');
                const numberInput = row.querySelector('input[type="number"]');

                if (select) {
                    if (!select.value) {
                        select.classList.add('outline_red2');
                        isValid = false;
                    } else {
                        select.classList.remove('outline_red2');
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

            // Collect values from each row in the response table
            const values = [];
            rows.forEach(row => {
                const groupId = row.dataset.group;
                const select = row.querySelector('select');
                const numberInput = row.querySelector('input[type="number"]');

                values.push({
                    group: groupId,
                    name: 'projectcode',
                    value: select ? select.value : ''
                });
                values.push({
                    group: groupId,
                    name: 'tarief',
                    value: numberInput ? numberInput.value : ''
                });
            });

            const submission = {
                submission: {
                    schemaVersion: defs.schemaVersion || '1.0',
                    sessionId: defs.sessionId || '',
                    supplier: defs.supplier || '',
                    sourceFile: defs.sourceFile || '',
                    submittedAt: new Date().toISOString(),
                    values: values
                }
            };

            console.log('Submission:', JSON.stringify(submission, null, 2));

            const screen2 = document.getElementById('screen2').style.display = 'none';
            const screen3El = document.getElementById('screen3');
            const createdJSONEl = document.getElementById('createdJSON').innerHTML = '<pre>' + JSON.stringify(submission, null, 2) + '</pre>';
            if (screen3El) screen3El.style.display = 'block';

            // Hier kun je verdere acties ondernemen, zoals het verzenden van gegevens naar de server
        }