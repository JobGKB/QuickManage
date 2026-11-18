@extends('layouts.app')

@section('content')
    @include('includes.menu')
    @include('documentation._messages')

    <div class="container-fluid doc-manage">
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="breadcrumbs">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="/manage/documentation">Documentatie</a></li>
                            <li class="breadcrumb-item">{{ $content->subject->name }}</li>
                            <li class="breadcrumb-item active" aria-current="page">{{ $content->title }}</li>
                        </ol>
                    </nav>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Onderdeel bewerken</h2>
                    <a href="/docs#{{ $content->slug }}" target="_blank" class="btn_view"><i class="fa-solid fa-eye eye"></i> Bekijken</a>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                    <div class="edit-form doc-form">
                        <form action="/manage/documentation/content/update/{{ $content->uniqid }}" method="POST">
                            @csrf
                            @method('PATCH')

                            @include('documentation._content_form')

                            <input type="submit" name="submit" value="Opslaan">
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @include('documentation._editor_assets')
@endsection
