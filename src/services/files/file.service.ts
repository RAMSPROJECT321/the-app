import { createId } from "@/utils/id";

type FileSystemModule = typeof import("expo-file-system/legacy");
type ImagePickerModule = typeof import("expo-image-picker");

let fileSystemModule: FileSystemModule | null = null;
let imagePickerModule: ImagePickerModule | null = null;
let fileSystemLoadFailed = false;
let imagePickerLoadFailed = false;

const getFileSystemModule = () => {
  if (fileSystemLoadFailed) {
    return null;
  }

  if (fileSystemModule) {
    return fileSystemModule;
  }

  try {
    fileSystemModule = require("expo-file-system/legacy") as FileSystemModule;
    return fileSystemModule;
  } catch (error) {
    fileSystemLoadFailed = true;
    console.warn("File system module is unavailable in this build.", error);
    return null;
  }
};

const getImagePickerModule = () => {
  if (imagePickerLoadFailed) {
    return null;
  }

  if (imagePickerModule) {
    return imagePickerModule;
  }

  try {
    imagePickerModule = require("expo-image-picker") as ImagePickerModule;
    return imagePickerModule;
  } catch (error) {
    imagePickerLoadFailed = true;
    console.warn("Image picker module is unavailable in this build.", error);
    return null;
  }
};

const getAttachmentDirectory = () => {
  const fileSystem = getFileSystemModule();

  if (!fileSystem?.documentDirectory) {
    return null;
  }

  return `${fileSystem.documentDirectory}attachments`;
};

const ensureAttachmentDirectoryAsync = async () => {
  const fileSystem = getFileSystemModule();
  const attachmentDirectory = getAttachmentDirectory();

  if (!fileSystem || !attachmentDirectory) {
    return null;
  }

  const info = await fileSystem.getInfoAsync(attachmentDirectory);

  if (!info.exists) {
    await fileSystem.makeDirectoryAsync(attachmentDirectory, {
      intermediates: true,
    });
  }

  return attachmentDirectory;
};

export const fileService = {
  async attachmentExistsAsync(localUri: string) {
    const fileSystem = getFileSystemModule();

    if (!fileSystem) {
      return false;
    }

    const info = await fileSystem.getInfoAsync(localUri);
    return info.exists;
  },
  async pickImageAttachmentAsync() {
    const imagePicker = getImagePickerModule();
    const fileSystem = getFileSystemModule();

    if (!imagePicker || !fileSystem) {
      return null;
    }

    const permission = await imagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return null;
    }

    const result = await imagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    const attachmentDirectory = await ensureAttachmentDirectoryAsync();

    if (!attachmentDirectory) {
      return null;
    }

    const extension = asset.fileName?.split(".").pop() ?? "jpg";
    const localFileName = `${createId("attachment")}.${extension}`;
    const localUri = `${attachmentDirectory}/${localFileName}`;
    await fileSystem.copyAsync({
      from: asset.uri,
      to: localUri,
    });

    return {
      name: asset.fileName ?? localFileName,
      mimeType: asset.mimeType ?? "image/jpeg",
      localUri,
      sizeInBytes: asset.fileSize ?? 0,
    };
  },
};
