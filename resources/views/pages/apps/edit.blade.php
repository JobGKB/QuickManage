@extends('layouts.app')


@section('content')
    @include('includes.menu')
    <div class="message_block">
        <div class="offset-lg-2 col-lg-9">
            @if ($message = Session::get('success'))
                <div class="successMessage alert alert-success alert-block pt-3 text-center">  
                    <strong>{{ $message }}</strong>
                </div>
            @endif

            @if ($errors->any())
            @foreach ($errors->all() as $error)
                <div class="alert alert-danger alert-block pt-3 text-center">
                    <strong>{{ $error }}</strong>
                </div>
            @endforeach
            @endif
        </div>
    </div>

    
    <div class="container-fluid">
        <div class="row">
                <div class="offset-lg-2 col-lg-9">
                    <div class="breadcrumbs">
                         <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">

                                
                                <li class="breadcrumb-item"><a href="/manage/folders">Mappen</a></li>
                                <li class="breadcrumb-item"><a href="/manage/folders/{{ session('folder_url') }}/view">{{ session('folder_name') }} </a></li>
                                <li class="breadcrumb-item active" aria-current="page">{{ $app->name }} bewerken</li>


                            </ol>
                        </nav>
                    </div>
                </div>
         </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">App: {{ $app->name }}</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                     
                    <div class="edit-form">
                        <form action='/manage/apps/update/{{$app->hash_id}}' method="POST" enctype="multipart/form-data">
                            @method('PATCH')
                            @csrf    
                            <p class="c-bold">App naam:</p>
                            <input type="text" name='name' value="{{ $app->name }}" required><br/><br/>
                            <div class="app-image mb-4">
                                <p>App afbeelding:</p> 
                                <input type='file' name='app_thumbnail' class='file' id='imgInp'>
                                <label for="imgInp"  class="file-input text-center"  >   @if($app->app_thumbnail)<img src="{{ asset('storage/app_thumbnails/' . $app->app_thumbnail) }}" id="img">@else <img src="{{ asset('/storage/gkb-groen.png') }}" id="img"> @endif   </label>
                            </div>
                            <p class="c-bold">Omschrijving:</p> 
                            <textarea name='description' >{{ $app->description }}</textarea><br/><br/>

                            <p class="c-bold mt-4">App categorie: {{  $app->app_category->category_name ?? 'geen' }}</p> 
                                <select name="category" id="categorySelect" enabled> 
                                    <option value="{{ $app->app_category->id ?? ' ' }}">{{  $app->app_category->category_name ?? 'Selecteer een categorie' }}</option>
                                @foreach($categories as $data)
    
                                    <option value="{{ $data->id }}"  >{{ $data->category_name }}</option>   
    
                                @endforeach
                                </select><br/> 
                                <br/>


                            <p class="c-bold">Repository:<br/><br/>

                            <input type="text" name='repo' value='{{ $app->repository }}' disabled><br/><br/>

                            <p class="c-bold">Workspace:</p>

                            <input type="text" name='workspace' value='{{ $app->workspace }}' disabled><br/><br/>

                            <p class="c-bold">Service:</p>

                            <select name="service" id="serviceSelect" required
                                    data-repo="{{ $app->repository }}"
                                    data-workspace="{{ $app->workspace }}"
                                    data-current="{{ $app->service }}">
                                @if($app->service)
                                    <option value="{{ $app->service }}" selected>{{ $app->service }}</option>
                                @endif
                            </select><br/><br/>

                            <p class="c-bold">Template:</p> 
                                    
                            <input type="text" name='template' value='{{ $app->template->name ?? 'geen' }}' disabled ><br/><br/>
        

                            {{-- <div class="workspace_parameters_title"><div class="c-bold">Workspace parameters</div><div class="show_in_app c-bold">Laten zien in App</div></div>  --}}
                                

                            {{-- <textarea class="textarea-content-page" name="content" placeholder="Content van de pagina..." required>{{$app->content}}</textarea><br/><br> 
                                <div  type="text" id='addfield' onclick=addField()><i class="fa fa-plus"></i></div> 
                                    <div  type="text" id='removefield' onclick=removeField()><i class="fa fa-minus"></i></div>
                                <div id="formfield"></div>
                            <br> --}}
                            <input type="submit" name="submit" value='Opslaan'>
                        </form>
                    </div>
                </div>
                        
            </div>
        </div>
    </div> 
    
    <script>
    document.addEventListener("DOMContentLoaded", async function () {
        const serviceSelect = document.getElementById("serviceSelect");
        if (!serviceSelect) return;

        const repo = serviceSelect.dataset.repo;
        const workspace = serviceSelect.dataset.workspace;
        const current = serviceSelect.dataset.current;

        if (!repo || !workspace) return;

        try {
            const response = await fetch(
                `https://fme-gkb.fmecloud.com/fmerest/v3/repositories/${encodeURIComponent(repo)}/items/${encodeURIComponent(workspace)}/services`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": "fmetoken token=653d48815e91626f06f6ed871b3810605193ac02",
                        "Accept": "application/json"
                    }
                }
            );

            if (!response.ok) throw new Error("Failed to fetch services");

            const data = await response.json();
            const services = Array.isArray(data) ? data : (data.items || []);

            // Reset options
            serviceSelect.innerHTML = '';

            services.forEach(service => {
                const option = document.createElement("option");
                option.value = service.name;
                option.textContent = service.name;
                if (service.name === current) {
                    option.selected = true;
                }
                serviceSelect.appendChild(option);
            });

            // If current service was not in the returned list, add it so user keeps the value
            if (current && !services.some(s => s.name === current)) {
                const option = document.createElement("option");
                option.value = current;
                option.textContent = current + " (huidig)";
                option.selected = true;
                serviceSelect.appendChild(option);
            }
        } catch (err) {
            console.error("Error fetching services:", err);
        }
    });
    </script>
    
@endsection