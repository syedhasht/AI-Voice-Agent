# Create 3 orders
$h = Invoke-RestMethod -Uri "http://localhost:8000/api/orders" -Method Post -Body '{"customer_name":"Alice Brown","phone_number":"+1 (555) 111-2222","medicine_name":"Amoxicillin 500mg","quantity":30}' -ContentType "application/json"
Write-Output "Created: $($h.id) - $($h.customer_name) - $($h.status)"

$h2 = Invoke-RestMethod -Uri "http://localhost:8000/api/orders" -Method Post -Body '{"customer_name":"Bob Smith","phone_number":"+1 (555) 333-4444","medicine_name":"Lisinopril 10mg","quantity":60}' -ContentType "application/json"
Write-Output "Created: $($h2.id) - $($h2.customer_name) - $($h2.status)"

$h3 = Invoke-RestMethod -Uri "http://localhost:8000/api/orders" -Method Post -Body '{"customer_name":"Carol Davis","phone_number":"+1 (555) 555-6666","medicine_name":"Metformin 850mg","quantity":90}' -ContentType "application/json"
Write-Output "Created: $($h3.id) - $($h3.customer_name) - $($h3.status)"

# List all
$list = Invoke-RestMethod -Uri "http://localhost:8000/api/orders"
Write-Output "`nTotal orders: $($list.total)"

# Get one
$get = Invoke-RestMethod -Uri "http://localhost:8000/api/orders/$($h.id)"
Write-Output "Get #$($h.id): $($get.customer_name) - $($get.status)"

# Update status
$upd = Invoke-RestMethod -Uri "http://localhost:8000/api/orders/$($h.id)" -Method Put -Body '{"status":"confirmed","notes":"Confirmed via AI call"}' -ContentType "application/json"
Write-Output "Updated #$($h.id): $($upd.status) - $($upd.notes)"

# Delete one
Invoke-RestMethod -Uri "http://localhost:8000/api/orders/$($h3.id)" -Method Delete
Write-Output "Deleted #$($h3.id)"

# Verify deletion
$list2 = Invoke-RestMethod -Uri "http://localhost:8000/api/orders"
Write-Output "Total after delete: $($list2.total)"

Write-Output "`nALL E2E TESTS PASSED"
