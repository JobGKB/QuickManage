<!doctype html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 0.25cm; }
        * { box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #222; font-size: 11px; border:1px solid #000000;  }

        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; margin-top: 10px; }
        .title { font-size: 22px; font-weight: bold; padding-left: 30px;   }
        .title .nr { color: #439034; }
        .date { text-align: right; font-size: 10px; color: #333; }
        .logo { text-align: left; }

        .body-table { width: 100%; border-collapse: collapse; }
        .body-table2 { width: 100%; border-collapse: collapse;   margin-top:30px;}
        .body-table3 { width: 100%; border-collapse: collapse;   }
        .body-table > tbody > tr > td { vertical-align: top; }
        .chart-cell { width: 90% }             
        .chart-cell-child1 { width: 5%;   }
        .chart-cell-child2 { width: 5%;   }

        .meta-table { width:100%; border-collapse: collapse;   font-size: 11px; }
        .meta-table td { padding: 2px 4px; vertical-align: top; }
        .meta-table div { padding: 2px 4px; vertical-align: top; }
        .meta-table .label { font-weight: bold; width: 180px; }
        .meta-table .label2 { font-weight: bold; width: 100px; border-right: 1px solid #000; }

        
        .points-cell { width: 35%;  text-align: left; padding-left:63px;}
        .points-cell-child1 { width: 35%; text-align: left; }
        .points-cell-child2 { width: 30%; text-align: right; }

        .points-cell-footer { width: 70%; text-align: right; }
        .points-cell-footer-child { width: 30%; text-align: left; }
        
        .border-contact { border: none; border-left:1px solid #000; border-top:1px solid #000;  }
        .border-bottom{ border-bottom:1px solid #000; }

         
       
    </style>
</head>
<body>
    @php
        $logoPath = public_path('storage/GKB-Realisatie-FC.png');
        $fmtAfstand = fn ($v) => rtrim(rtrim(number_format((float) $v, 2, '.', ''), '0'), '.');
    @endphp

    <table class="header-table">
        <tr>
            <td>
                <div class="title"><strong>Profiel: <span class="nr">{{ $profiel['profielcode'] ?? '' }}</span></strong></div>
            </td>
            <td style="width: 30%;">
               
            </td>
        </tr>
    </table>

    <table class="body-table">
        <tr>
             <td class="chart-cell-child1">
                
            </td>
            <td class="chart-cell">
                <img src="data:image/svg+xml;base64,{{ base64_encode($chartSvg) }}" style="width: 1000px; height: 529px;" alt="Profielgrafiek">
            </td>
            <td class="chart-cell-child2">
                
            </td>
        </tr>
    </table>

    <table class="body-table2">
        <tr>
            <td class="points-cell ">
                <table class="meta-table">
                    <tr>
                        <td class="label">Legger:</td>
                        <td>{{ $profiel['legger'] ?? '' }}</td>
                        
                    </tr>
                    <tr>
                        <td class="label">Polderpeil (m¹ NAP):</td>
                        <td>{{ $profiel['polderpeil'] ?? '' }}</td>
                        
                    </tr>
                    <tr>
                        <td class="label">Waterpeil (m¹ NAP):</td>
                        <td>{{ $profiel['waterpeil'] ?? '' }}</td>
                        
                    </tr>
                    <tr>
                        <td class="label"> </td>
                        <td> </td>
                        
                    </tr>
                    <tr>
                        <td class="label"> </td>
                        <td> </td>
                        
                    </tr>
                     
                </table>

            </td> 

            <td class="points-cell-child1 ">
                <table class="meta-table">
                    
                        @foreach ($profiel['dynamic_fields'] ?? [] as $groep)
                            @foreach ($groep as $naam => $waarde)
                                <tr>
                                    <td class="label">{{ ucfirst($naam) }}:</td>
                                    <td>{{ $waarde }}</td>
                                </tr>
                            @endforeach
                        @endforeach
 
                </table>
            </td>
            
            <td class="points-cell-child2 border-contact">
                <table class="meta-table">
                    <tr>
                        <td class="label2">Opdrachtgever</td>
                        <td>{{ $profiel['opdrachtgever'] ?? '' }}</td>
                    </tr>

                    <tr>
                        <td class="label2">Project</td>
                        <td>{{ $profiel['project'] ?? '' }}</td>
                    </tr>

                     <tr>
                        <td class="label2">Omschrijving</td>
                        <td>{{ $profiel['omschrijving'] ?? '' }}</td>
                    </tr>

                    <tr>
                        <td class="label2">Profielcode</td>
                        <td>{{ $profiel['profielcode'] ?? '' }}</td>
                    </tr>

                    <tr>
                        <td class="label2">Baggercode</td>
                        <td>{{ $profiel['baggercode'] ?? '' }}</td>
                    </tr>
                </table>
            </td>

        </tr>
    </table>

    <table class="body-table3">
        <tr>

            <td class="points-cell-footer">  
                <table class="meta-table">
                    <tr>
                        <td class="label"> </td>
                        <td> </td>
                    </tr>
                </table>
            </td> 

            <td class="points-cell-footer-child border-contact">
                <table class="meta-table">
                    <tr>
                        <td class="label ">   
                            @if (is_file($logoPath))
                                <div class="logo"><img src="{{ $logoPath }}" alt="GKB" height="66"></div>
                                @endif
                        </td>
                        <td> <div>GKB Realisatie</div><div> 0180 - 64 29 29 </div><div>info@gkbgroep.nl</div> <div>www.gkbgroep.nl</div></td>
                    </tr>
                </table>
            </td>

        </tr>
    </table>

</body>
</html>