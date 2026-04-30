document.addEventListener("DOMContentLoaded", async function() {
    // ophalen repositories  
    try {
        const response = await fetch("https://fme-gkb.fmecloud.com/fmerest/v3/repositories", {
          method: "GET",
          headers: {
            "Authorization": "fmetoken token=653d48815e91626f06f6ed871b3810605193ac02",  // replace 'x' with your real token
            "Accept": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const items = data.items;

        // Get the <select> element
        const select = document.getElementById("repoSelect");

        // create option elementen in de repoSelect html element ( <selection> )
        items.forEach(item => {
          const option = document.createElement("option");
          option.value = item.name;
          option.textContent = item.name;
          select.appendChild(option);
        });

      } catch (err) {
        console.error("Fetch failed:", err);
      }
      //

      // als de waarde van repoSelect veranderd ( dus er wordt een repositorie geselecteed ) 
repoSelect.addEventListener("change", async function () {
      const selectedRepo = this.value;
            // /1. enable workspace selection 
      if (selectedRepo === "0") {
        workspaceSelect.disabled = true;
        serviceSelect.disabled = true;
        return;
      }

      console.log("Selected repository:", selectedRepo);

      // Clear and disable subsequent selects
      workspaceSelect.innerHTML = '<option value="0">Selecteer een Workspace:</option>';
      workspaceSelect.disabled = true;
      //2. haal de workspaces op van de geselecteerde repo
      try {
        const workspaceResponse = await fetch(`https://fme-gkb.fmecloud.com/fmerest/v3/repositories/${encodeURIComponent(selectedRepo)}/items`, {
          method: "GET",
          headers: {
            "Authorization": "fmetoken token=653d48815e91626f06f6ed871b3810605193ac02",  // Replace with real token
            "Accept": "application/json"
          }
        });

        if (!workspaceResponse.ok) throw new Error("Failed to load workspaces");

        const workspaceData = await workspaceResponse.json();

        const workspaces = workspaceData.items.filter(item => item.type === "WORKSPACE");
        // 3. maak lijstje met worspaces
        if (workspaces.length > 0) {
          workspaces.forEach(w => {
            const option = document.createElement("option");
            option.value = w.name;
            option.textContent = w.name;
            workspaceSelect.appendChild(option);
          });

          workspaceSelect.disabled = false;
        } else {
          console.log("No workspaces found in repository.");
        }

      } catch (err) {
        console.error("Error fetching workspaces:", err);
      }
    });
    //

    // als de waarde van workspaceSelect veranderd ( dus er wordt workspace geselecteed ) 
workspaceSelect.addEventListener("change", async function () {
  const selectedRepo = repoSelect.value;
  const selectedWorkspace = this.value;

  if (selectedWorkspace === "0") {
    serviceSelect.disabled = true;
    return;
  }

  console.log("Selected workspace:", selectedWorkspace);

  // Clear previous service options
  serviceSelect.innerHTML = '<option value="0">Selecteer een Service:</option>';
  serviceSelect.disabled = true;
   
  ////


  // ophalen services
  try {
    const serviceResponse = await fetch(`https://fme-gkb.fmecloud.com/fmerest/v3/repositories/${encodeURIComponent(selectedRepo)}/items/${encodeURIComponent(selectedWorkspace)}/services`, {
      method: "GET",
      headers: {
        "Authorization": "fmetoken token=653d48815e91626f06f6ed871b3810605193ac02",  // Replace with your token
        "Accept": "application/json"
      }
    });

    if (!serviceResponse.ok) throw new Error("Failed to fetch services");
    
    const servicesData = await serviceResponse.json();
console.log("Full services response:", servicesData);
    const services = servicesData || [];
    // create option list met services van de workspace
    if (services.length > 0) {
      services.forEach(service => {
        const option = document.createElement("option");
        option.value = service.name;
        option.textContent = service.name;
        serviceSelect.appendChild(option);
      });

      serviceSelect.disabled = false;
    } else {
      console.log("No services available for this workspace.");
    }

  } catch (err) {
    console.error("Error fetching services:", err);
  }
  //



// show parameter in form
const parameterContainer = document.getElementById("parameterContainer");
parameterContainer.innerHTML = ""; // Clear previous

try {
  const paramResponse = await fetch(
    `https://fme-gkb.fmecloud.com/fmerest/v3/repositories/${encodeURIComponent(selectedRepo)}/items/${encodeURIComponent(selectedWorkspace)}/parameters`,
    {
      method: "GET",
      headers: {
        "Authorization": "fmetoken token=653d48815e91626f06f6ed871b3810605193ac02",  // Replace with your token
        "Accept": "application/json"
      }
    }
  );

  const parameters = await paramResponse.json();
  console.log("Workspace parameters:", parameters);

  if (parameters.length > 0) {
    parameters.forEach(param => {
      const label = document.createElement("label");
      label.textContent = param.description || param.name;
      label.style.paddingBottom = "20px";
      label.style.paddingTop = "20px";
 
      const input_checkbox = document.createElement("input");
      input_checkbox.type = "checkbox"; // Simplified; can adjust based on param.type
      input_checkbox.name = 'parameter_'+param.name+','+param.type;
      input_checkbox.style.width = "22px";
      input_checkbox.style.height = "22px";
      input_checkbox.style.marginTop = "18px";
      input_checkbox.style.float = "right";
      input_checkbox.style.accentColor = "#439034";

      const input = document.createElement("input");
      input.type = "text"; // Simplified; can adjust based on param.type
      input.name = 'parameter_'+param.name;
      input.value = param.defaultValue || ""; 
      input.disabled = true;

      const div = document.createElement("div");
      div.className = "parameter_box";
      div.appendChild(label); 
      // div.appendChild(input_checkbox);
      div.appendChild(document.createElement("br"));
      div.appendChild(input);
      div.appendChild(document.createElement("br"));

      parameterContainer.appendChild(div);
    });
  } else {
    parameterContainer.innerHTML = "<p>No parameters available.</p>";
  }

} catch (err) {
  console.error("Error fetching parameters:", err);
  parameterContainer.innerHTML = "<p>Failed to load parameters...</p>";
}
});




//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////


});