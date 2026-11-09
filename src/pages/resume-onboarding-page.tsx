import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { deleteResumeProfile, getResumeProfile, uploadResume } from '@/lib/api';
import { toast } from '@/components/ui/sonner';
import type { ResumeProfile } from '@/lib/types';
import { ArrowRight, FileText, Loader2, Trash2, Upload } from 'lucide-react';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
export function ResumeOnboardingPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const loadedProfile = await getResumeProfile(token);
        if (active) setProfile(loadedProfile);
      } catch {
        if (active) toast.error('Could not load your saved resume profile.');
      } finally {
        if (active) setIsLoadingProfile(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [getToken]);

  const handleUpload = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    try {
      const token = (await getToken()) ?? undefined;
      await uploadResume(file, token);
      toast.success('Resume profile saved. Your interview questions can now use your experience.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Resume upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (selected: File | undefined) => {
    if (!selected) return;
    const extension = selected.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx'].includes(extension || '')) {
      toast.error('Choose a PDF or DOCX resume.');
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      toast.error('Resume files must be 5 MB or smaller.');
      return;
    }
    setFile(selected);
  };

  const handleDeleteProfile = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const token = (await getToken()) ?? undefined;
      await deleteResumeProfile(token);
      setProfile(null);
      toast.success('Saved resume profile deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the resume profile.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Make your interviews personal"
        description="Upload your resume and get practice questions about your skills, projects, and experience."
      />

      <Card className="mx-auto max-w-2xl space-y-6 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-bold text-foreground">Optional resume upload</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We extract professional experience, projects, education, and skills. Your original file
              is processed by the configured AI provider and discarded after extraction. Only the
              extracted professional details are saved to your account.
            </p>
          </div>
        </div>

        {!isLoadingProfile && profile && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Resume profile saved</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile.skills.length} skills · {profile.projects.length} projects · {profile.experience.length} experience details
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleDeleteProfile} disabled={isDeleting} aria-label="Delete saved resume profile">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>{isDeleting ? 'Deleting…' : 'Delete'}</span>
              </Button>
            </div>
            {profile.summary && <p className="text-sm text-muted-foreground">{profile.summary}</p>}
          </div>
        )}

        <label
          htmlFor="resume-file"
          className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center transition-colors hover:border-primary/50"
        >
          <Upload className="h-6 w-6 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {file?.name ?? 'Choose a PDF or DOCX resume'}
          </span>
          <span className="text-xs text-muted-foreground">Maximum file size: 5 MB</span>
          <input
            id="resume-file"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </label>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button asChild variant="ghost">
            <Link to="/dashboard">
              Skip for now
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading} variant="gradient">
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? 'Processing resume…' : 'Save resume profile'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
