<?php
// chat-api/operator-reply.php
require_once __DIR__ . '/helpers.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    jsonResponse(['success' => false, 'error' => 'Invalid JSON'], 400);
}

$userId  = sanitize($data['user_id'] ?? '');
$message = sanitize($data['message'] ?? '');

if ($userId === '' || $message === '') {
    jsonResponse(['success' => false, 'error' => 'user_id and message required'], 400);
}

$name    = sanitize($data['name']  ?? '');
$phone   = sanitize($data['phone'] ?? '');
$pageUrl = sanitize($data['page_url'] ?? '');

$sessionId = getOrCreateSession(
    $userId,
    $name !== '' ? $name : null,
    $phone !== '' ? $phone : null,
    $pageUrl !== '' ? $pageUrl : null
);

$messageId = insertMessage($sessionId, 'operator', $message);

jsonResponse([
    'success'     => true,
    'session_id'  => $sessionId,
    'message_id'  => $messageId,
]);
