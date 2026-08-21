export default function Card({ children, className = '', as: Tag = 'div', hover = false, ...props }) {
    return (
        <Tag
            className={`rounded-2xl border border-ink-100 bg-canvas p-6 shadow-sm ${
                hover ? 'transition-shadow duration-300 hover:shadow-lg' : ''
            } ${className}`}
            {...props}
        >
            {children}
        </Tag>
    );
}
