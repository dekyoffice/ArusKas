<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="s62">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="14" ss:Color="#000000" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/>
  </Style>
  <Style ss:ID="s63">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000" ss:Bold="1"/>
   <Interior ss:Color="#F4F4F4" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s64">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Alignment ss:Vertical="Bottom" ss:WrapText="1"/>
  </Style>
  <Style ss:ID="s65">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <NumberFormat ss:Format="&quot;Rp&quot;\ #,##0"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Laporan">
  <Table>
   <Column ss:Width="30"/>
   <Column ss:Width="250"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   
   <Row ss:Height="20">
    <Cell ss:MergeAcross="7" ss:StyleID="s62"><Data ss:Type="String">Laporan Realisasi Anggaran Tahun {{ $year }}</Data></Cell>
   </Row>
   <Row ss:Index="3">
    <Cell ss:StyleID="s63"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">Sub Kegiatan</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">Pagu Perjalanan Dinas</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">Realisasi PD</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">Sisa PD</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">Pagu Makan Minum</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">Realisasi MM</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">Sisa MM</Data></Cell>
   </Row>
   
   @foreach($stats as $index => $stat)
   <Row>
    <Cell ss:StyleID="s64"><Data ss:Type="Number">{{ $index + 1 }}</Data></Cell>
    <Cell ss:StyleID="s64"><Data ss:Type="String">{{ htmlspecialchars($stat['nama']) }}</Data></Cell>
    <Cell ss:StyleID="s65"><Data ss:Type="Number">{{ $stat['pdPagu'] }}</Data></Cell>
    <Cell ss:StyleID="s65"><Data ss:Type="Number">{{ $stat['pdRealisasi'] }}</Data></Cell>
    <Cell ss:StyleID="s65"><Data ss:Type="Number">{{ $stat['pdSisa'] }}</Data></Cell>
    <Cell ss:StyleID="s65"><Data ss:Type="Number">{{ $stat['mmPagu'] }}</Data></Cell>
    <Cell ss:StyleID="s65"><Data ss:Type="Number">{{ $stat['mmRealisasi'] }}</Data></Cell>
    <Cell ss:StyleID="s65"><Data ss:Type="Number">{{ $stat['mmSisa'] }}</Data></Cell>
   </Row>
   @endforeach
   
  </Table>
 </Worksheet>
</Workbook>
