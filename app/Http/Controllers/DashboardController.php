<?php

namespace App\Http\Controllers;

use App\Models\userAnalytics;
use App\Models\App;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index(Request $request)
    {
        $ip = $request->ip();

        // dd($request);
        return view('dashboard', ['ip' => $ip,  ]);
    }

    /**
     * Return the number of unique visitors active in the last 10 minutes.
     */
    public function liveVisitors()
    {
        
        $count = userAnalytics::where('last_seen_at', '>=', now()->subSeconds(10))
            ->distinct('visitor_id')
            ->count('visitor_id');

        return response()->json(['count' => $count]);

    }
}
