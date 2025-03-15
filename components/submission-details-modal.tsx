import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type SubmissionDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  submission: any | null;
};

export function SubmissionDetailsModal({ isOpen, onClose, submission }: SubmissionDetailsModalProps) {
  if (!submission) return null;

  function getYouTubeEmbedUrl(url: string) {
    try {
      // Handle different YouTube URL formats
      const urlObj = new URL(url);
      let videoId = '';
  
      // Handle youtu.be links
      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      }
      // Handle youtube.com/watch links
      else if (urlObj.hostname.includes('youtube.com')) {
        if (urlObj.pathname.includes('/watch')) {
          videoId = urlObj.searchParams.get('v');
        }
        // Handle youtube.com/live links
        else if (urlObj.pathname.includes('/live')) {
          videoId = urlObj.pathname.split('/live/')[1];
        }
      }
  
      // Return embed URL if we found a video ID
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      
      // Fallback to original URL if parsing fails
      return url.replace("watch?v=", "embed/");
    } catch (error) {
      // If URL parsing fails completely, try basic replacement
      return url.replace("watch?v=", "embed/");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto"> {/* Scrollable content */}
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
          <DialogDescription>{`View details for ${submission.type}`}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <p><strong>Submitted By:</strong> {submission.submittedBy}</p>
          <p><strong>Submission Date:</strong> {submission.submissionDate}</p>

          {/* Display Bug Number */}
          {submission.type === "Bug" && (
            <p><strong>Bug Number:</strong> #{submission.details.bugNumber}</p>
          )}

          {/* Display Description */}
          {submission.details.description && (
            <div>
              <h3 className="font-semibold">Description</h3>
              <p>{submission.details.description}</p>
            </div>
          )}

          {/* Display Justification for Advanced Enhancements */}
          {submission.details.justification && (
            <div>
              <h3 className="font-semibold">Justification</h3>
              <p>{submission.details.justification}</p>
            </div>
          )}

          {/* Bug & Enhancement Screenshots */}
          {submission.details.screenshots?.map((screenshot: string, index: number) => (
            <div key={index} className="mt-2">
              <h3 className="font-semibold">Screenshot {index + 1}</h3>
              <Image src={screenshot} alt={`Screenshot ${index}`} width={400} height={300} className="rounded-md" />
            </div>
          ))}

          {/* Brainstorm Map PDF */}
          {submission.type === "Brainstorm Map" && (
            <div>
              <h3 className="font-semibold">Brainstorm Map</h3>
              <p>
                <a href={submission.details.fileUrl} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                  View Brainstorm Map (PDF)
                </a>
              </p>
            </div>
          )}

          {/* Presentation YouTube Link */}
          {submission.type === "Presentation" && (
            <div>
              <h3 className="font-semibold">Presentation Video</h3>
              <iframe
                width="560"
                height="315"
                src={getYouTubeEmbedUrl(submission.details.youtubeLink)}                
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="mt-2"
              ></iframe>
            </div>
          )}

          {/* Project Link */}
          {submission.type === "Project" && (
            <div>
              <h3 className="font-semibold">Project Link</h3>
              <p>
                <a href={submission.details.projectLink} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                  View Project
                </a>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
