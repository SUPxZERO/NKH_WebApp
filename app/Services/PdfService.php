<?php

namespace App\Services;

use Illuminate\Support\Facades\View;
use Mpdf\Mpdf;

class PdfService
{
    /**
     * Generate PDF from a view using mPDF (supports Khmer OTL/Subscripts).
     * 
     * @param string $view The view name (e.g., 'exports.sales')
     * @param array $data Data to pass to the view
     * @return string Raw PDF content
     */
    public function generate(string $view, array $data = []): string
    {
        $html = View::make($view, $data)->render();

        $defaultConfig = (new \Mpdf\Config\ConfigVariables())->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];

        $defaultFontConfig = (new \Mpdf\Config\FontVariables())->getDefaults();
        $fontData = $defaultFontConfig['fontdata'];

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_left' => 10,
            'margin_right' => 10,
            'margin_top' => 10,
            'margin_bottom' => 10,
            'default_font' => 'notosanskhmer',
            'fontDir' => array_merge($fontDirs, [
                storage_path('fonts'),
            ]),
            'fontdata' => $fontData + [
                'notosanskhmer' => [
                    'R' => 'NotoSansKhmer-Regular.ttf',
                    'B' => 'NotoSansKhmer-Bold.ttf',
                    'useOTL' => 0xFF, // Enable OpenType Layout for subscripts
                    'useKashida' => 75,
                ]
            ],
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
        ]);

        $mpdf->WriteHTML($html);

        return $mpdf->Output('', 'S');
    }
}
