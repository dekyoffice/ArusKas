<!DOCTYPE html>
<html>
<head>
    <title>Laporan Anggaran {{ $year }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        h2 { text-align: center; }
    </style>
</head>
<body>
    <h2>Laporan Realisasi Anggaran Tahun {{ $year }}</h2>
    
    <table border="1">
        <thead>
            <tr>
                <th>No</th>
                <th>Sub Kegiatan</th>
                <th>Pagu Perjalanan Dinas</th>
                <th>Realisasi PD</th>
                <th>Sisa PD</th>
                <th>Pagu Makan Minum</th>
                <th>Realisasi MM</th>
                <th>Sisa MM</th>
            </tr>
        </thead>
        <tbody>
            @foreach($stats as $index => $stat)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $stat['nama'] }}</td>
                <td>Rp {{ number_format($stat['pdPagu'], 0, ',', '.') }}</td>
                <td>Rp {{ number_format($stat['pdRealisasi'], 0, ',', '.') }}</td>
                <td>Rp {{ number_format($stat['pdSisa'], 0, ',', '.') }}</td>
                <td>Rp {{ number_format($stat['mmPagu'], 0, ',', '.') }}</td>
                <td>Rp {{ number_format($stat['mmRealisasi'], 0, ',', '.') }}</td>
                <td>Rp {{ number_format($stat['mmSisa'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
