# Enable TCP/IP on the local default SQL Server instance with static port 1433,
# then restart the service. Run elevated.
$tcp = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQLServer\SuperSocketNetLib\Tcp'

Set-ItemProperty -LiteralPath $tcp -Name Enabled -Value 1

# Only the loopback addresses: the backend connects to localhost, and the rest of
# this machine's adapters stay closed to the network.
Get-ChildItem -LiteralPath $tcp | Where-Object {
    (Get-ItemProperty -LiteralPath $_.PSPath).IpAddress -in '127.0.0.1', '::1'
} | ForEach-Object {
    Set-ItemProperty -LiteralPath $_.PSPath -Name Enabled -Value 1
    Set-ItemProperty -LiteralPath $_.PSPath -Name TcpPort -Value '1433'
    Set-ItemProperty -LiteralPath $_.PSPath -Name TcpDynamicPorts -Value ''
}

Restart-Service -Name MSSQLSERVER -Force
Write-Output 'TCP enabled on 1433, MSSQLSERVER restarted.'
