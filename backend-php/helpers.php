<?php
// chat-api/helpers.php
require_once __DIR__ . '/config.php';

/**
 * Find or create a session by user_id.
 * Optionally updates name/phone/page_url if new values are given.
 */
function getOrCreateSession(
    string $userId,
    ?string $name = null,
    ?string $phone = null,
    ?string $pageUrl = null
): int {
    $pdo = getPDO();

    // Try to find existing session
    $stmt = $pdo->prepare("SELECT * FROM chat_sessions WHERE user_id = :user_id LIMIT 1");
    $stmt->execute([':user_id' => $userId]);
    $session = $stmt->fetch();

    $now = date('Y-m-d H:i:s');

    if ($session) {
        // Optionally update basic info if not already set
        $fields = [];
        $params = [':id' => $session['id']];

        if ($name && !$session['name']) {
            $fields[]       = 'name = :name';
            $params[':name'] = $name;
        }
        if ($phone && !$session['phone']) {
            $fields[]        = 'phone = :phone';
            $params[':phone'] = $phone;
        }
        if ($pageUrl && !$session['page_url']) {
            $fields[]           = 'page_url = :page_url';
            $params[':page_url'] = $pageUrl;
        }

        if ($fields) {
            $sql = "UPDATE chat_sessions SET " . implode(', ', $fields) . " WHERE id = :id";
            $pdo->prepare($sql)->execute($params);
        }

        return (int)$session['id'];
    }

    // Create new session
    $stmt = $pdo->prepare("
        INSERT INTO chat_sessions (user_id, name, phone, page_url, status, created_at, updated_at)
        VALUES (:user_id, :name, :phone, :page_url, 'open', :created_at, :updated_at)
    ");
    $stmt->execute([
        ':user_id'    => $userId,
        ':name'       => $name,
        ':phone'      => $phone,
        ':page_url'   => $pageUrl,
        ':created_at' => $now,
        ':updated_at' => $now,
    ]);

    return (int)$pdo->lastInsertId();
}

/**
 * Insert a message and update session.updated_at.
 */
function insertMessage(int $sessionId, string $sender, string $message): int {
    $pdo = getPDO();
    $now = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare("
        INSERT INTO chat_messages (session_id, sender, message, created_at)
        VALUES (:session_id, :sender, :message, :created_at)
    ");
    $stmt->execute([
        ':session_id' => $sessionId,
        ':sender'     => $sender,
        ':message'    => $message,
        ':created_at' => $now,
    ]);

    $pdo->prepare("
        UPDATE chat_sessions
        SET updated_at = :updated_at
        WHERE id = :id
    ")->execute([
        ':updated_at' => $now,
        ':id'         => $sessionId,
    ]);

    return (int)$pdo->lastInsertId();
}
