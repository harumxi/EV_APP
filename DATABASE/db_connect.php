$stmt = $pdo->query("SELECT * FROM EV_Models");
$models = $stmt->fetchAll();
