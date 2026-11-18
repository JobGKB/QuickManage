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
                            <li class="breadcrumb-item">{{ $subject->name }}</li>
                            <li class="breadcrumb-item active" aria-current="page">Onderdeel aanmaken</li>
                        </ol>
                    </nav>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Onderdeel aanmaken in: {{ $subject->name }}</h2>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                    <div class="edit-form doc-form">
                        <form action="/manage/documentation/content/store/{{ $subject->uniqid }}" method="POST">
                            @csrf

                            @include('documentation._content_form', ['content' => null])

                            <input type="submit" name="submit" value="Aanmaken">
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @include('documentation._editor_assets')
@endsection
