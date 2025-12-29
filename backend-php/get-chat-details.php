<?php
// chat-api/get-chat-details.php
require_once __DIR__ . '/config.php';

$userId  = isset($_GET['user_id']) ? sanitize($_GET['user_id']) : '';
$sinceId = isset($_GET['since_id']) ? (int)$_GET['since_id'] : 0;

if ($userId === '') {
    jsonResponse(['success' => false, 'error' => 'user_id required'], 400);
}

$pdo = getPDO();

// Find session by user_id
$stmt = $pdo->prepare("SELECT * FROM chat_sessions WHERE user_id = :user_id LIMIT 1");
$stmt->execute([':user_id' => $userId]);
$session = $stmt->fetch();

if (!$session) {
    jsonResponse([
        'success'      => true,
        'session'      => null,
        'conversation' => [],
    ]);
}

// Fetch messages
if ($sinceId > 0) {
    $stmt = $pdo->prepare("
        SELECT id, sender, message, created_at
        FROM chat_messages
        WHERE session_id = :session_id AND id > :since_id
        ORDER BY id ASC
    ");
    $stmt->execute([
        ':session_id' => $session['id'],
        ':since_id'   => $sinceId,
    ]);
} else {
    $stmt = $pdo->prepare("
        SELECT id, sender, message, created_at
        FROM chat_messages
        WHERE session_id = :session_id
        ORDER BY id ASC
    ");
    $stmt->execute([
        ':session_id' => $session['id'],
    ]);
}

$messages = [];
while ($row = $stmt->fetch()) {
    $messages[] = [
        'id'        => (int)$row['id'],
        'sender'    => $row['sender'],
        'message'   => $row['message'],
        'timestamp' => $row['created_at'],
    ];
}

jsonResponse([
    'success'      => true,
    'session'      => [
        'id'       => (int)$session['id'],
        'user_id'  => $session['user_id'],
        'name'     => $session['name'],
        'phone'    => $session['phone'],
        'page_url' => $session['page_url'],
        'status'   => $session['status'],
    ],
    // IMPORTANT: `conversation` name matches what both
    // operator-dashboard.js and script.js expect.
    'conversation' => $messages,
]);
