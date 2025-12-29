<?php
// chat-api/get-chats.php
require_once __DIR__ . '/config.php';

$pdo = getPDO();

/*
 * We return an array of chat objects shaped to match
 * operator-dashboard.js expectations:
 *
 * [
 *   {
 *     "user_id": "...",
 *     "name": "...",
 *     "phone": "...",
 *     "page_url": "...",
 *     "last_message": "...",
 *     "last_timestamp": "YYYY-MM-DD HH:MM:SS",
 *     "last_updated": "YYYY-MM-DD HH:MM:SS"
 *   }, ...
 * ]
 */

$sql = "
    SELECT
        s.id,
        s.user_id,
        s.name,
        s.phone,
        s.page_url,
        s.status,
        s.updated_at AS last_updated,
        (
            SELECT m.message
            FROM chat_messages m
            WHERE m.session_id = s.id
            ORDER BY m.id DESC
            LIMIT 1
        ) AS last_message,
        (
            SELECT m.created_at
            FROM chat_messages m
            WHERE m.session_id = s.id
            ORDER BY m.id DESC
            LIMIT 1
        ) AS last_timestamp
    FROM chat_sessions s
    ORDER BY s.updated_at DESC
";

$rows = $pdo->query($sql)->fetchAll();

$chats = array_map(function ($row) {
    return [
        'user_id'        => $row['user_id'],
        'name'           => $row['name'] ?: 'کاربر',
        'phone'          => $row['phone'] ?: '',
        'page_url'       => $row['page_url'] ?: '',
        'status'         => $row['status'],
        'last_message'   => $row['last_message'] ?: '',
        'last_timestamp' => $row['last_timestamp'] ?: $row['updated_at'],
        'last_updated'   => $row['last_updated'],
    ];
}, $rows);

jsonResponse($chats);
