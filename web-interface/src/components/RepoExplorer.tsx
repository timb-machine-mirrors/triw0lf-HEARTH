"use client";

import React, { useState, useEffect } from 'react';
import { FolderOpen, File, ChevronRight, ChevronDown, Github, ExternalLink, ArrowLeft } from 'lucide-react';
import { marked } from 'marked';

interface RepoItem {
  name: string;
  path: string;
  type: 'dir' | 'file';
  download_url?: string;
}

const HIDDEN_PATHS = ['.github', 'Assets', 'docs', 'CNAME'];

const RepoExplorer = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<RepoItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<RepoItem | null>(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepoContents();
  }, [currentPath]);

  const fetchRepoContents = async (path: string = currentPath) => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.github.com/repos/THORCollective/HEARTH/contents/${path}`);
      const data = await response.json();
      
      // Update items if we're fetching for the current path
      if (path === currentPath) {
        setItems(data);
      }
      return data;
    } catch (error) {
      console.error('Error fetching repo contents:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkdown = async (url: string) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      setMarkdownContent(marked(text));
    } catch (error) {
      console.error('Error fetching markdown:', error);
    }
  };

  const [folderContents, setFolderContents] = useState<Record<string, RepoItem[]>>({});

  const toggleFolder = async (path: string) => {
    const isExpanding = !expandedFolders[path];
    
    setExpandedFolders(prev => ({
      ...prev,
      [path]: isExpanding
    }));

    if (isExpanding && !folderContents[path]) {
      const contents = await fetchRepoContents(path);
      setFolderContents(prev => ({
        ...prev,
        [path]: contents
      }));
    }
  };

  const handleFileClick = async (item: RepoItem) => {
    if (item.name.endsWith('.md') && item.download_url) {
      setSelectedFile(item);
      await fetchMarkdown(item.download_url);
    }
  };

  const handleBack = () => {
    setSelectedFile(null);
    setMarkdownContent('');
  };

  const renderFileTree = (items: RepoItem[]) => {
    const filteredItems = items.filter(item => !HIDDEN_PATHS.includes(item.name));
    
    return (
      <div className="space-y-1">
        {filteredItems.map((item) => (
          <div key={item.path} className="pl-4">
            {item.type === 'dir' ? (
              <div>
                <button
                  onClick={() => toggleFolder(item.path)}
                  className="flex items-center space-x-2 w-full hover:bg-gray-800 p-2 rounded-lg text-left"
                >
                  {expandedFolders[item.path] ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                  <FolderOpen className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-200">{item.name}</span>
                </button>
                {expandedFolders[item.path] && (
                  <div className="ml-4 border-l border-gray-700">
                    {folderContents[item.path] && renderFileTree(folderContents[item.path])}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleFileClick(item)}
                className="flex items-center space-x-2 w-full hover:bg-gray-800 p-2 rounded-lg text-left ml-6"
              >
                <File className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">{item.name}</span>
                <ExternalLink className="w-3 h-3 ml-auto text-gray-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-100">HEARTH Repository Explorer</h1>
          <a 
            href="https://github.com/THORCollective/HEARTH"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-300 hover:text-gray-100"
          >
            <Github className="w-6 h-6" />
            <span>View on GitHub</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Repository Structure</h2>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
              </div>
            ) : (
              renderFileTree(items)
            )}
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100">
                {selectedFile ? selectedFile.name : 'File Preview'}
              </h2>
              {selectedFile && (
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 text-gray-400 hover:text-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
            </div>
            <div className="prose prose-invert max-w-none">
              {selectedFile ? (
                <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
              ) : (
                <div className="text-gray-400 text-center py-12">
                  Select a file to view its contents
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepoExplorer;