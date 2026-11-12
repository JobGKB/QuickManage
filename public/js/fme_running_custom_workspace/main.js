function loadingFunction() {
    document.getElementById('mess2').style.display = 'block';
    document.getElementById("loading").style.display = 'none';
    document.getElementById("mess1").style.display = 'none';
  }

  const url = window.location.href;
  const urlParams = url.substring(url.indexOf("?")+1);  
  const urlX = urlParams.split("&");
  const publishedParams = {};
 
urlX.forEach(item => {
    const [name, value] = item.split('=');
    // Skip unwanted parameters
    if (name === 'workspace' || name === 'repo' || name === 'formText') {
        return;
    }
    // Add to object in FME format
    publishedParams[name] = value;
});
//  console.log(publishedParams)

const queryString = url.split('?')[1] || '';
const params = new URLSearchParams(queryString);
['workspace', 'repo', 'formText'].forEach(name => params.delete(name));
const filteredQueryString = params.toString();

    console.log(filteredQueryString);
 
  // Funtie om de waardes uit de parameters te filteren
  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      if (pair[0] == variable) {
        return pair[1];
      }
    }   
    console.log('Query Variable ' + variable + ' not found');
    
  }
  
  const formText = getQueryVariable('formText');  
  console.log(formText);
  if(formText === undefined) {
    document.getElementById("mess").innerHTML = ' '; 
  }
  else {
  const text = decodeURIComponent(formText);
  document.getElementById("mess").innerHTML = text; 

  }   


function runService() {

  const repo = getQueryVariable('repo');
  const workspaceName = getQueryVariable('workspace');
  console.log(repo)
  console.log(workspaceName)
            
            // get services information about workspace
            $.ajax({ 
            type: 'GET',
            url: "https://fme.gkbgroep.nl/fmeapiv4/workspaces/"+ repo + "/" + workspaceName + "/services",
            headers: {  
            "Authorization":"fmetoken token=653d48815e91626f06f6ed871b3810605193ac02", 
            "Accept":"application/octet-stream",
            },
            success: function (response, id) {  
              console.log(response); // The response data from the server
              const fmejobs = response.fmejobsubmitter.registered;  
              const fmestreaming = response.fmedatastreaming.registered;  
              const fmedownload  = response.fmedatadownload.registered; 


                if(fmejobs && fmestreaming==false && fmedownload==false){ 
                  console.log("execute jobs service");  

                  // post request run job (repro + workspacename + publishedparameters)
                    $.ajax({      
                      type: 'POST',   
                      url: "https://fme.gkbgroep.nl/fmeapiv4/jobs", 
                      headers:  {  
                        "Authorization":"fmetoken token=653d48815e91626f06f6ed871b3810605193ac02", 
                        "Content-Type":"application/json",  
                        "Accept":"application/json",  
                        },
                      data: JSON.stringify({
                          "directives": {},
                          "failureTopics": [],
                          "successTopics": [],
                          "maxJobRuntime": 0,
                          "maxTimeInQueue": 0,
                          "queue": "STANDARD",
                          "repository": repo,
                          "workspace": workspaceName,
                          "publishedParameters": publishedParams
                      }),
                      success: function (response, id) {  
                           
                          const idRes = response.id;

                          console.log("job id: " + idRes);

                           $.ajax({      
                            type: 'GET',   
                            url: "https://fme.gkbgroep.nl/fmeapiv4/jobs/"+idRes+"/result?longPoll=true", 
                            headers:  {  
                              "Authorization":"fmetoken token=653d48815e91626f06f6ed871b3810605193ac02", 
                              "Content-Type":"application/json",  
                              "Accept":"application/json",  
                              }, 
                            
                            success: function (response, id) {  
                                console.log(response.status)
                                console.log(response.statusMessage)
                                document.getElementById('mess2').innerHTML = 'Uw actie is uitgevoerd met status: <strong>'+response.status+'</strong> !';
                               loadingFunction();
                            }, 
                              error: function (xhr, status, error) {
                                console.error("Request failed with status: " + status);
                                document.getElementById("loading").style.display = 'none';
                                document.getElementById("mess1").style.display = 'none';
                                document.getElementById("errorMessage").style.display = "block";
                                document.getElementById('errorMessage').innerHTML = 'Error... Workspace kan niet worden opgehaald!';
                            }
                          });

                      }, 
                        error: function (xhr, status, error) {
                          console.error("Request failed with status: " + status);
                          document.getElementById("loading").style.display = 'none';
                          document.getElementById("mess1").style.display = 'none';
                          document.getElementById("errorMessage").style.display = "block";
                          document.getElementById('errorMessage').innerHTML = 'Error... Workspace kan niet worden opgehaald!';
                      }
                    });

                }
  
                if(fmejobs && fmestreaming==false && fmedownload){
                  const a = 'fmedatadownload';
                  console.log(" execute jobs and datadownload");

                  // post request run job (repro + workspacename + publishedparameters)
                    $.ajax({      
                      type: 'POST',   
                      url: "https://fme.gkbgroep.nl/fmeapiv4/jobs", 
                      headers:  {  
                        "Authorization":"fmetoken token=653d48815e91626f06f6ed871b3810605193ac02", 
                        "Content-Type":"application/json",  
                        "Accept":"application/json",  
                        },
                      data: JSON.stringify({
                          "directives": {},
                          "failureTopics": [],
                          "successTopics": [],
                          "maxJobRuntime": 0,
                          "maxTimeInQueue": 0,
                          "queue": "STANDARD",
                          "repository": repo,
                          "workspace": workspaceName,
                          "publishedParameters": publishedParams
                      }),
                      success: function (response, id) {  
                          console.log(response)
                         
                      }, 
                        error: function (xhr, status, error) {
                          console.error("Request failed with status: " + status);
                          document.getElementById("loading").style.display = 'none';
                          document.getElementById("mess1").style.display = 'none';
                          document.getElementById("errorMessage").style.display = "block";
                          document.getElementById('errorMessage').innerHTML = 'Error... Workspace kan niet worden opgehaald!';
                      }
                    });

                  // get request get datadownload file 
                    $.ajax({      
                      type: 'GET',   
                      url: "https://fme.gkbgroep.nl/"+ a + "/" + repo + "/" + workspaceName + "?" + filteredQueryString + "&opt_responseformat=json&token=653d48815e91626f06f6ed871b3810605193ac02", 
                      headers:  {  
                        "Authorization":"fmetoken token=653d48815e91626f06f6ed871b3810605193ac02", 
                        "Content-Type":"application/json",  
                        "Accept":"application/json",  
                        },
                      success: function (response, id) {  
                          console.log(response)
                          console.log(response.serviceResponse.url)
                          console.log('Succes POST Request running workspace!'); // The response data from the server 

                          function autoDownload(url) {
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = '';  // Laat browser zelf de bestandsnaam bepalen
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                          }
                          const downloadUrl = response.serviceResponse.url;
                          
                          autoDownload(downloadUrl);
                          
                          loadingFunction();

                      }, 
                      error: function (xhr, status, error) {
                        console.error("Request failed with status: " + status);
                        document.getElementById("loading").style.display = 'none';
                        document.getElementById("mess1").style.display = 'none';
                        document.getElementById("errorMessage").style.display = "block";
                        document.getElementById('errorMessage').innerHTML = 'Error... Workspace kan niet worden opgehaald!';
                      }
                  });

                }
                
                if(fmejobs && fmestreaming && fmedownload==false){
                  const a = 'fmedatastreaming';
                  console.log("execute jobs and datastreaming");
                 
                  // post request run job (repro + workspacename + publishedparameters)
                    $.ajax({      
                      type: 'POST',   
                      url: "https://fme.gkbgroep.nl/fmeapiv4/jobs", 
                      headers:  {  
                        "Authorization":"fmetoken token=653d48815e91626f06f6ed871b3810605193ac02", 
                        "Content-Type":"application/json",  
                        "Accept":"application/json",  
                        },
                      data: JSON.stringify({
                          "directives": {},
                          "failureTopics": [],
                          "successTopics": [],
                          "maxJobRuntime": 0,
                          "maxTimeInQueue": 0,
                          "queue": "STANDARD",
                          "repository": repo,
                          "workspace": workspaceName,
                          "publishedParameters": publishedParams
                      }),
                      success: function (response, id) {  
                          console.log(response + 'd')
                         
                      }, 
                        error: function (xhr, status, error) {
                          console.error("Request failed with status: " + status);
                          document.getElementById("loading").style.display = 'none';
                          document.getElementById("mess1").style.display = 'none';
                          document.getElementById("errorMessage").style.display = "block";
                          document.getElementById('errorMessage').innerHTML = 'Error... Workspace kan niet worden opgehaald!';
                      }
                    });

                    // create data streaming link and auto click on it to download in browser
                    function autoDownload(url) {
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = '';  // Laat browser zelf de bestandsnaam bepalen
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      setTimeout(loadingFunction,2500);

                    }

                    const url = "https://fme.gkbgroep.nl/"+ a + "/" + repo + "/" + workspaceName + "?" + filteredQueryString + "&opt_responseformat=json&token=653d48815e91626f06f6ed871b3810605193ac02";
                    console.log(url);
                    autoDownload(url);


                }

                if(fmejobs && fmestreaming && fmedownload){
                  const a = 'fmedatastreaming';
                  console.log("execute jobs and datastreaming");

                  // post request run job (repro + workspacename + publishedparameters)
                    $.ajax({      
                      type: 'POST',   
                      url: "https://fme.gkbgroep.nl/fmeapiv4/jobs", 
                      headers:  {  
                        "Authorization":"fmetoken token=653d48815e91626f06f6ed871b3810605193ac02", 
                        "Content-Type":"application/json",  
                        "Accept":"application/json",  
                        },
                      data: JSON.stringify({
                          "directives": {},
                          "failureTopics": [],
                          "successTopics": [],
                          "maxJobRuntime": 0,
                          "maxTimeInQueue": 0,
                          "queue": "STANDARD",
                          "repository": repo,
                          "workspace": workspaceName,
                          "publishedParameters": publishedParams
                      }),
                      success: function (response, id) {  
                          console.log(response)
                         
                      }, 
                        error: function (xhr, status, error) {
                          console.error("Request failed with status: " + status);
                          document.getElementById("loading").style.display = 'none';
                          document.getElementById("mess1").style.display = 'none';
                          document.getElementById("errorMessage").style.display = "block";
                          document.getElementById('errorMessage').innerHTML = 'Error... Workspace kan niet worden opgehaald!';
                      }
                    });

                    // create data streaming link and auto click on it to download in browser
                    function autoDownload(url) {
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = '';  // Laat browser zelf de bestandsnaam bepalen
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      setTimeout(loadingFunction,2500);

                    }

                    const url = "https://fme.gkbgroep.nl/"+ a + "/" + repo + "/" + workspaceName + "?" + filteredQueryString + "&opt_responseformat=json&token=653d48815e91626f06f6ed871b3810605193ac02";
                    console.log(url);
                    autoDownload(url);
                    

                }

                if(fmejobs==false && fmestreaming==false && fmedownload){
                  const a = 'fmedatadownload';
                  console.log("execute fmedownload");

                   // get request get datadownload file 
                    $.ajax({      
                      type: 'GET',   
                      url: "https://fme.gkbgroep.nl/"+ a + "/" + repo + "/" + workspaceName + "?" + filteredQueryString + "&opt_responseformat=json&token=653d48815e91626f06f6ed871b3810605193ac02", 
                      headers:  {  
                        "Authorization":"fmetoken token=653d48815e91626f06f6ed871b3810605193ac02", 
                        "Content-Type":"application/json",  
                        "Accept":"application/json",  
                        },
                      success: function (response, id) {  
                          console.log(response)
                          console.log(response.serviceResponse.url)
                          console.log('Succes POST Request running workspace!'); // The response data from the server 

                          function autoDownload(url) {
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = '';  // Laat browser zelf de bestandsnaam bepalen
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                          }
                          const downloadUrl = response.serviceResponse.url;
                          autoDownload(downloadUrl);
                          loadingFunction();
                      }, 
                      error: function (xhr, status, error) {
                        console.error("Request failed with status: " + status);
                        document.getElementById("loading").style.display = 'none';
                        document.getElementById("mess1").style.display = 'none';
                        document.getElementById("errorMessage").style.display = "block";
                        document.getElementById('errorMessage').innerHTML = 'Error... Workspace kan niet worden opgehaald!';
                    }
                  });
                 
                }

                if(fmejobs==false && fmestreaming && fmedownload==false){
                  const a = 'fmedatastreaming';
                  console.log("execute fmedatastreaming");


                  // create data streaming link and auto click on it to download in browser
                  function autoDownload(url) {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = '';  // Laat browser zelf de bestandsnaam bepalen
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setTimeout(loadingFunction,2500);
                  }

                    const url = "https://fme.gkbgroep.nl/"+ a + "/" + repo + "/" + workspaceName + "?" + filteredQueryString + "&opt_responseformat=json&token=653d48815e91626f06f6ed871b3810605193ac02";
                    console.log(url);
                    autoDownload(url);
                    
                }

                if(fmejobs==false && fmestreaming && fmedownload){
                  const a = 'fmedatastreaming';
                  console.log("execute fmedatastreaming");
                 
                  // create data streaming link and auto click on it to download in browser
                    function autoDownload(url) {
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = '';  // Laat browser zelf de bestandsnaam bepalen
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      setTimeout(loadingFunction,2500);
                    }

                    const url = "https://fme.gkbgroep.nl/"+ a + "/" + repo + "/" + workspaceName + "?" + filteredQueryString + "&opt_responseformat=json&token=653d48815e91626f06f6ed871b3810605193ac02";
                    console.log(url);
                    autoDownload(url);
                    
                }

                if(fmejobs==false && fmestreaming==false && fmedownload==false){
                  console.log("er zijn geen services beschikbaar voor deze workspace...");
                  document.getElementById('mess2').innerHTML = 'Er zijn geen services beschikbaar voor deze workspace...';
                  loadingFunction();
                }

          },                               
          error: function (xhr, status, error) {
            console.error("Request failed with status: " + status);  
            document.getElementById("loading").style.display = 'none';
            document.getElementById("mess1").style.display = 'none';
            document.getElementById("errorMessage").style.display = "block";
            document.getElementById('errorMessage').innerHTML = 'Error... Bestand kan niet worden opgehaald!';
        }
        });
}

 runService();


 