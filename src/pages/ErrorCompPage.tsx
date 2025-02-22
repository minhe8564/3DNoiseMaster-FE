import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlobalStyles from '../styles/GlobalStyles';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Group, Box3, Vector3, MeshNormalMaterial } from 'three';
import backIcon from '../assets/icon/back.png';

const Loader = () => {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
};

const ObjModel = ({ url, wireframe }: { url: string, wireframe: boolean }) => {
  const obj = useLoader(OBJLoader, url) as Group;

  useEffect(() => {
    const box = new Box3().setFromObject(obj);
    const size = box.getSize(new Vector3());

    const maxDimension = Math.max(size.x, size.y, size.z);
    const desiredSize = 2.8;
    const scaleFactor = desiredSize / maxDimension;

    obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
    obj.position.set(0, 0, 0);

    obj.traverse((child) => {
      if ((child as any).isMesh) {
        (child as any).material = new MeshNormalMaterial({
          wireframe: wireframe,
        });
      }
    });
  }, [obj]);

  useEffect(() => {
    obj.traverse((child) => {
      if ((child as any).isMesh) {
        (child as any).material.wireframe = wireframe;
      }
    });
  }, [wireframe, obj]);

  return <primitive object={obj} />;
};

const ErrorCompPage: React.FC = () => {
  const navigate = useNavigate();
  const [taskName, setTaskName] = useState<string>('');
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [fileURL1, setFileURL1] = useState<string | null>(null);
  const [fileURL2, setFileURL2] = useState<string | null>(null);
  const [filePreview1, setFilePreview1] = useState<string | ArrayBuffer | null>(null);
  const [filePreview2, setFilePreview2] = useState<string | ArrayBuffer | null>(null);
  const [isWireframe1, setIsWireframe1] = useState<boolean>(false);
  const [isWireframe2, setIsWireframe2] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (fileURL1) {
        URL.revokeObjectURL(fileURL1);
      }
    };
  }, [fileURL1]);

  useEffect(() => {
    return () => {
      if (fileURL2) {
        URL.revokeObjectURL(fileURL2);
      }
    };
  }, [fileURL2]);

  const handleFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const maxSize = 16 * 1024 * 1024; // 16MB

      if (fileExtension !== 'obj') {
        alert('.obj 확장자 파일을 업로드 해주세요.');
        return;
      }

      if (selectedFile.size > maxSize) {
        alert('파일 크기가 16MB를 초과할 수 없습니다.');
        return;
      }

      setFile1(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setFileURL1(url);
      setFilePreview1(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setFilePreview1(event.target.result);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

      if (fileExtension !== 'obj') {
        alert('.obj 확장자 파일을 업로드 해주세요.');
        return;
      }

      setFile2(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setFileURL2(url);
      setFilePreview2(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setFilePreview2(event.target.result);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !file1 || !file2) {
      alert('모든 필드를 채워주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('task_name', taskName);
    formData.append('file1', file1);
    formData.append('file2', file2);

    try {
      setIsLoading(true);
      console.log('Sending form data:', {
        task_name: taskName,
        file1: file1.name,
        file2: file2.name,
      });

      const response = await axios.post(`${process.env.REACT_APP_API_WORKSPACE_URL}/request/errorComp`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Server response:', response);
      setIsCompleted(true);
      setTimeout(() => {
        setIsCompleted(false);
        navigate('/api/display/workspace');
      }, 2000);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('작업 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWireframe1 = () => {
    setIsWireframe1(!isWireframe1);
  };

  const toggleWireframe2 = () => {
    setIsWireframe2(!isWireframe2);
  };

  return (
    <div style={styles.container}>
      <GlobalStyles />
      <div style={styles.leftPane}>
        {fileURL1 ? (
          <Canvas style={styles.canvas}>
            <ambientLight />
            <pointLight position={[100, 100, 100]} />
            <Suspense fallback={<Loader />}>
              <ObjModel url={fileURL1} wireframe={isWireframe1} />
            </Suspense>
            <OrbitControls />
          </Canvas>
        ) : filePreview1 ? (
          <img src={filePreview1 as string} alt="파일 미리보기 1" style={styles.imagePreview} />
        ) : (
          <p>첫 번째 파일을 업로드하면 여기에 미리보기가 표시됩니다.</p>
        )}
      </div>
      <div style={styles.leftPane}>
        {fileURL2 ? (
          <Canvas style={styles.canvas}>
            <ambientLight />
            <pointLight position={[100, 100, 100]} />
            <Suspense fallback={<Loader />}>
              <ObjModel url={fileURL2} wireframe={isWireframe2} />
            </Suspense>
            <OrbitControls />
          </Canvas>
        ) : filePreview2 ? (
          <img src={filePreview2 as string} alt="파일 미리보기 2" style={styles.imagePreview} />
        ) : (
          <p>두 번째 파일을 업로드하면 여기에 미리보기가 표시됩니다.</p>
        )}
      </div>
      <div style={styles.rightPane}>
      <img src={backIcon} alt="작업 공간" style={styles.backButton} onClick={() => navigate('/api/display/workspace/newTask')} />
        <h1 style={styles.heading}>Error rate Comparison</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            작업 이름
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            첫 번째 파일 업로드 &nbsp;&nbsp;
            <button
              type="button"
              onClick={toggleWireframe1}
              style={{
                ...styles.wireframeButton,
                backgroundColor: isWireframe1 ? '#007bff' : 'white',
                color: isWireframe1 ? 'white' : 'black',
              }}
            >
            {isWireframe1 ? 'Wireframe 비활성화' : 'Wireframe 활성화'}
            </button>
            <input
              type="file"
              onChange={handleFile1Change}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            두 번째 파일 업로드 &nbsp;&nbsp;
            <button
              type="button"
              onClick={toggleWireframe2}
              style={{
                ...styles.wireframeButton,
                backgroundColor: isWireframe2 ? '#007bff' : 'white',
                color: isWireframe2 ? 'white' : 'black',
              }}
            >
            {isWireframe2 ? 'Wireframe 비활성화' : 'Wireframe 활성화'}
            </button>
            <input
              type="file"
              onChange={handleFile2Change}
              required
              style={styles.input}
            />
          </label>
          <button type="submit" style={styles.submitButton}>Submit</button>
        </form>
      </div>
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingPopup}>로딩중...</div>
        </div>
      )}
      {isCompleted && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingPopup}>작업이 성공적으로 생성되었습니다.</div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    height: '100vh',
    position: 'relative',
  },
  leftPane: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRight: '1px solid #ccc',
  },
  rightPane: {
    flex: 1,
    padding: '30px',
    backgroundColor: '#333',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '30px',
    width: '50px', 
    height: '50px',
    cursor: 'pointer',
  },
  heading: {
    padding: '30px 20px',
    position: 'absolute',
    top: '20px',
    textAlign: 'center',
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: '100%',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  label: {
    width: '100%',
    marginBottom: '50px',
    fontSize: '22px',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '8px',
    margin: '8px',
    marginTop: '20px',
    fontSize: '16px',
    maxWidth: '500px',
  },
  wireframeButton: {
    padding: '10px 20px',
    border: '1px solid #333',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily:'NanumSquare_R'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#333',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    position: 'absolute',
    bottom: '50px',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '20px',
    fontSize: '20px',
    fontFamily:'NanumSquare_B',
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingPopup: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    fontSize: '18px',
    fontFamily: 'NanumSquare_B',
  },
};

export default ErrorCompPage;
