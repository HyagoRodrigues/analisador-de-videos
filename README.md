# Analisador de Vídeos do YouTube

Este projeto permite baixar vídeos do YouTube, extrair o áudio, transcrever o conteúdo usando o modelo Whisper e salvar a transcrição em um arquivo DOCX formatado.

## Requisitos

- Python 3.8 ou superior
- FFmpeg (incluído no repositório)
- Bibliotecas Python (listadas em requirements.txt)

## Instalação

1. Clone o repositório:
git clone https://github.com/seu-usuario/analisador-videos.git cd analisador-videos

2. Instale as dependências:
pip install -r requirements.txt


## Uso

Execute o script principal:
python youtube_analyzer.py


O programa irá:
1. Solicitar a URL de um vídeo do YouTube
2. Baixar o vídeo e extrair o áudio
3. Transcrever o áudio usando o modelo Whisper
4. Salvar a transcrição em um arquivo DOCX formatado

## Funcionalidades

- Download de vídeos do YouTube
- Extração de áudio
- Transcrição automática usando IA (modelo Whisper)
- Formatação e salvamento em documento Word

## Estrutura do Projeto

- `youtube_analyzer.py`: Script principal
- `ffmpeg.exe`, `ffplay.exe`, `ffprobe.exe`: Ferramentas para processamento de áudio/vídeo
- `temp/`: Diretório para arquivos temporários

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.