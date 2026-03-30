 
@extends('layouts.app')

@section('content')
    @include('includes.menu')

    <div class="container-fluid">
        <div class="row">
                <div class="offset-lg-2 col-lg-9">
                    <div class="breadcrumbs">
                         <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item active" aria-current="page">Dashboard</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Welkom , {{ Auth::user()->name }}</h2>
                </div>
            </div>
        </div>
    </div>  
    <div class="container-fluid">

        <div class="row">
            <div class="offset-lg-2 col-lg-4 mt-5" >
              
                <div class='dashboard-default-box'>
                    <div class="dashboard-default-box-content">
                        <div class="loading">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div> 
                </div>
            </div> 
            <div class="col-lg-3 mt-5" >
                <div class='dashboard-default-box'>
                   <div class="dashboard-default-box-content">
                        <div class="loading">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div> 
                </div>
            </div>
            <div class="col-lg-2 mt-5" >
                <div class='dashboard-default-box'>
                    <div class="dashboard-default-box-content">
                        <div class="loading">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div> 
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-4 mt-5">
                <div class='dashboard-default-box2'>
                    <div class="dashboard-default-box-content">
                        <div class="loading">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div> 
                </div>
            </div>
            <div class="col-lg-5  mt-5">
                <div class='dashboard-default-box2'>
                    <div class="dashboard-default-box-content">
                        <div class="loading">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div> 
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-4 mt-5">
                <div class='dashboard-default-box'>
                   <div class="dashboard-default-box-content">
                        <div class="loading">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div> 
                </div>
            </div>
            <div class="col-lg-5  mt-5">
                <div class='dashboard-default-box'>
                    <div class="dashboard-default-box-content">
                        <div class="loading">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div> 
                </div>
            </div>
        </div>
        
    </div>
    
@endsection 


