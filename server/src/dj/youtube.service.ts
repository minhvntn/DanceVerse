export class YoutubeService {
  static extractVideoId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  }

  static async fetchMetadata(url: string) {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    try {
      // Use oEmbed API to fetch basic metadata without an API key
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch video metadata');
      }

      const data = await response.json();

      return {
        videoId,
        title: data.title,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channel: data.author_name,
        duration: null, // oEmbed does not return duration
      };
    } catch (error: any) {
      throw new Error('Unable to resolve YouTube video: ' + error.message);
    }
  }
}
