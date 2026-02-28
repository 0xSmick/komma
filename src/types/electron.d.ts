export {};

interface VaultRefs {
  docs: string[];
  mcps: string[];
  vault?: boolean;
  architecture?: boolean;
  skills?: string[];
}

interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
  author: string;
}

declare global {
  interface Window {
    electronAPI?: {
      onMenuAction(callback: (action: string, ...args: unknown[]) => void): () => void;
      getPendingFile(): Promise<string | null>;
      settings: {
        get(): Promise<Record<string, any>>;
        set(key: string, value: any): Promise<Record<string, any>>;
      };
      dialog: {
        openDirectory(): Promise<string | null>;
      };
      file: {
        rename(filePath: string, newName: string): Promise<{ success: boolean; newPath?: string; error?: string }>;
        move(filePath: string, destDir: string): Promise<{ success: boolean; newPath?: string; error?: string }>;
        delete(filePath: string): Promise<{ success: boolean; error?: string }>;
      };
      vault: {
        resolveRoot(fromPath: string): Promise<string | null>;
        getIndex(fromPath: string): Promise<{
          vaultRoot: string;
          files: Array<{ relativePath: string; firstLine: string }>;
        } | null>;
        listFiles(fromPath: string): Promise<string[]>;
      };
      google: {
        checkExisting(docPath: string): Promise<{ url: string; title: string; updatedAt: string } | null>;
        shareDoc(markdown: string, title: string, docPath: string, action?: 'new' | 'update'): Promise<{ success: boolean; url?: string; error?: string }>;
        openUrl(url: string): Promise<void>;
        signOut(): Promise<void>;
        checkConfigured(): Promise<boolean>;
        saveCredentials(clientId: string, clientSecret: string): Promise<boolean>;
        loadCredentials(): Promise<{ clientId: string; clientSecret: string }>;
        pullDoc(localPath: string): Promise<{
          comments: Array<{ googleId: string; selectedText: string; comment: string; createdTime: string }>;
          remoteText: string;
        }>;
      };
      git: {
        commit(filePath: string, message: string): Promise<{ success: boolean; error?: string; sha?: string; skipped?: boolean; noChanges?: boolean }>;
        log(filePath: string, limit?: number): Promise<{ success: boolean; commits?: GitCommit[]; error?: string }>;
        show(filePath: string, sha: string): Promise<{ success: boolean; content?: string; error?: string }>;
        push(filePath: string, message?: string): Promise<{ success: boolean; error?: string; sha?: string; remote?: string; branch?: string; fileUrl?: string }>;
        remoteInfo(filePath: string): Promise<{ success: boolean; remoteUrl?: string | null; remoteName?: string | null; branch?: string | null; error?: string }>;
      };
      quickCapture: {
        inferTemplate(description: string): Promise<{ templateId: string; folder: string }>;
        getShortcut(): Promise<string>;
        setShortcut(shortcut: string): Promise<{ success: boolean }>;
      };
      claude: {
        sendEdit(prompt: string, filePath: string, model?: string, refs?: VaultRefs): Promise<void>;
        sendChat(
          message: string,
          docPath: string,
          sessionId: number | null,
          contextSelection: string | null,
          history: Array<{ role: string; content: string }>,
          model?: string,
          refs?: VaultRefs,
          images?: Array<{ data: string; mimeType: string; name: string }>
        ): Promise<void>;
        cancel(): Promise<void>;
        reviseChunk(
          chunkId: string,
          beforeText: string,
          currentAfterText: string,
          instruction: string,
          model?: string,
        ): Promise<{ success: boolean; revisedText?: string; error?: string }>;
        listMcps(): Promise<{ name: string; source?: string }[]>;
        listSkills(): Promise<{ name: string; description?: string; source?: string }[]>;
        readSkill(name: string): Promise<string | null>;
        onStream(
          callback: (data: { type: 'edit' | 'chat'; content: string }) => void
        ): () => void;
        onComplete(
          callback: (data: {
            type: 'edit' | 'chat';
            success: boolean;
            content?: string;
            error?: string;
            proposal?: { originalContent: string; proposedContent: string; docPath: string } | null;
          }) => void
        ): () => void;
        multiGenerate(
          sections: Array<{ title: string; prompt: string }>,
          filePath: string,
          outline: string,
          model?: string,
        ): Promise<{ success: boolean; filePath?: string }>;
        multiCancel(): Promise<void>;
        onMultiProgress(
          callback: (data: { sectionIndex: number; status: string; output: string }) => void
        ): () => void;
        onMultiComplete(
          callback: (data: { success: boolean; filePath?: string; cancelled?: boolean }) => void
        ): () => void;
      };
    };
  }
}
