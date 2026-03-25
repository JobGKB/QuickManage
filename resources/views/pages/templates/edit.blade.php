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
                <div class="header-container">
                    <h2 class="m-0">{{ $template->name }} bewerken</h2>
                </div>
            </div>
        </div> 
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                     
                     <form action="/manage/template/update/{{ $template->id }}" method="POST" enctype='multipart/form-data'>
                         @method('PATCH')
                        @csrf
                        <p class="c-bold">Template naam:</p>
                        <input type="text" name='name' value="{{ $template->name }}" required><br/><br/>
                        <p class="c-bold">Thumbnail afbeelding:</p>
                        <div class="template-upload-image">
                            <input type='file' name='image_thumbnail' class='file' id='imgInp1'>
                            <label for="imgInp1"  class="file-input text-center"> @if($template->dummy_image)<img src="data:image/png;base64,{{ $template->dummy_image }} " id="img1">@else <img src="{{ asset('/storage/default.png') }}" id="img1"> @endif </label>
                        </div><br/><br/>
                        <p class="c-bold">Header logo:</p>
                        <div class="template-upload-image">
                            <input type='file' name='header_logo' class='file' id='imgInp2'>
                            <label for="imgInp2"  class="file-input text-center"> @if($template->header_logo)<img src="data:image/png;base64,{{ $template->header_logo }} " id="img2">@else <img src="{{ asset('/storage/default.png') }}" id="img2"> @endif </label>
                        </div><br/><br/>
                        <p class="c-bold">Footer afbeelding:</p>
                        <div class="template-upload-image">
                            <input type='file' name='footer_image' class='file' id='imgInp3'>
                            <label for="imgInp3"  class="file-input text-center"> @if($template->footer_image)<img src="data:image/png;base64,{{ $template->footer_image }} " id="img3">@else <img src="{{ asset('/storage/default.png') }}" id="img3"> @endif </label>
                        </div><br/><br/>

                        <p class="c-bold">Achtergrond kleur:</p>
                        <label for="favcolor">Kies een kleur:</label>
                        <input type="color" id="favcolor" name="background_color" value="{{ $template->background_color }}" onchange="updateFromPicker(this.value)">

                        <input type="text" id="colorText" value="{{ $template->background_color }}" oninput="updateFromText(this.value)">

                        <input type="submit" name="submit" value='Bijwerken'>

                     </form>
                </div>
            </div>
        </div>
    </div>
{{-- script colorpicker    --}}
<script>

    function readURL1(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function(e) {
                $('#img1').attr('src', e.target.result);
            }

            reader.readAsDataURL(input.files[0]); // convert to base64 string
        }
    }

    $("#imgInp1").change(function() {
        readURL1(this);
    });

    function readURL2(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function(e) {
                $('#img2').attr('src', e.target.result);
            }

            reader.readAsDataURL(input.files[0]); // convert to base64 string
        }
    }

    $("#imgInp2").change(function() {
        readURL2(this);
    });
    function readURL3(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function(e) {
                $('#img3').attr('src', e.target.result);
            }

            reader.readAsDataURL(input.files[0]); // convert to base64 string
        }
    }
    $("#imgInp3").change(function() {
        readURL3(this);
    });

   function updateFromPicker(color) {
    document.getElementById('colorText').value = color;
    updatePreview(color);
  }

  function updateFromText(color) {
    if (/^#([0-9A-Fa-f]{6})$/.test(color)) {
      document.getElementById('favcolor').value = color;
      updatePreview(color);
    }
  }
  
</script>

@endsection
