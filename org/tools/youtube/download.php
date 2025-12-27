<?php
if (isset($_POST['url'])) {
    $videoUrl = trim($_POST['url']);

    // Extract YouTube video ID
    preg_match(
        '/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/',
        $videoUrl,
        $matches
    );

    if (!isset($matches[1])) {
        die("Invalid YouTube URL");
    }

    $videoId = $matches[1];

    // YouTube internal info endpoint (basic example — may stop working!)
    $infoUrl = "https://www.youtube.com/get_video_info?video_id=" . $videoId;
    $videoInfo = file_get_contents($infoUrl);

    parse_str($videoInfo, $info);
    if (!isset($info['url_encoded_fmt_stream_map'])) {
        die("Failed to retrieve video data.");
    }

    $streamMap = urldecode($info['url_encoded_fmt_stream_map']);
    $streams = explode(',', $streamMap);
    $first = $streams[0];
    $parts = explode("url=", $first);
    $downloadUrl = $parts[1] ?? "";

    if (!$downloadUrl) {
        die("Download URL not found.");
    }

    // Redirect browser to download the video file
    header("Location: $downloadUrl");
    exit;
}
?>
